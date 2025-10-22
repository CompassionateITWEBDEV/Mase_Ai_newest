"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Search,
  Download,
  FileText,
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Eye,
  Filter,
  Printer,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Star,
} from "lucide-react"
import Link from "next/link"

export default function HRFiles() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)

  // Mock data for completed applications/employee files
  const [employeeFiles, setEmployeeFiles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // In a real app, you would fetch employee data here
  // useEffect(() => {
  //   const loadEmployeeFiles = async () => {
  //     try {
  //       const response = await fetch('/api/hr/employees')
  //       const data = await response.json()
  //       setEmployeeFiles(data.employees || [])
  //     } catch (error) {
  //       console.error('Failed to load employee files:', error)
  //       setEmployeeFiles([])
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }
  //   loadEmployeeFiles()
  // }, [])

  // For now, just show empty state
  useEffect(() => {
    setIsLoading(false)
  }, [])

  const filteredEmployees = employeeFiles.filter((emp) => {
    const matchesSearch =
      emp.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || emp.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportStateReport = () => {
    // Generate state compliance report
    const reportData = employeeFiles.map((emp) => ({
      employeeId: emp.employeeId,
      name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
      position: emp.position,
      employmentType: emp.employmentType,
      email: emp.personalInfo.email,
      phone: emp.personalInfo.phone,
      hireDate: emp.hireDate,
      status: emp.status,
    }))

    console.log("Exporting state report:", reportData)
    // In real app, this would generate and download a CSV/PDF
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
      case "cleared":
      case "current":
      case "completed":
      case "signed":
        return <Badge className="bg-green-100 text-green-800">{status}</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>
      case "expiring":
        return <Badge className="bg-orange-100 text-orange-800">{status}</Badge>
      case "expired":
      case "missing":
        return <Badge className="bg-red-100 text-red-800">{status}</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getDocumentIcon = (status: string) => {
    switch (status) {
      case "verified":
      case "cleared":
      case "current":
      case "completed":
      case "signed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "expiring":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "expired":
      case "missing":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
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
                <h1 className="text-2xl font-bold text-gray-900">HR Employee Files</h1>
                <p className="text-gray-600">Complete employee records and compliance tracking</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button onClick={exportStateReport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                State Report
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print Files
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="employee-files" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="employee-files">Employee Files</TabsTrigger>
            <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
            <TabsTrigger value="state-audit">State Audit Ready</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="employee-files" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, email, or employee ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee Files List */}
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {employee.position} • {employee.employmentType}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.personalInfo.email}
                            </span>
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {employee.personalInfo.phone}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Hired: {employee.hireDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={
                            employee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {employee.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(employee)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View File
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="state-audit" className="space-y-6">
            {/* State Audit Ready Report */}
            <Card>
              <CardHeader>
                <CardTitle>State Audit Report</CardTitle>
                <CardDescription>Complete employee contact information for state compliance audits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Employee Contact Directory</h3>
                      <p className="text-sm text-gray-600">
                        All full-time and part-time employees with contact information
                      </p>
                    </div>
                    <Button onClick={exportStateReport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Employee ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeeFiles.map((employee) => (
                          <tr key={employee.id}>
                            <td className="px-4 py-4 text-sm font-medium">{employee.employeeId}</td>
                            <td className="px-4 py-4 text-sm">
                              {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                            </td>
                            <td className="px-4 py-4 text-sm">{employee.position}</td>
                            <td className="px-4 py-4 text-sm">
                              <Badge variant="outline">{employee.employmentType}</Badge>
                            </td>
                            <td className="px-4 py-4 text-sm">{employee.personalInfo.email}</td>
                            <td className="px-4 py-4 text-sm">{employee.personalInfo.phone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            {/* Compliance Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Shield className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">98%</p>
                      <p className="text-gray-600 text-sm">Compliance Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-gray-600 text-sm">Complete Files</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-gray-600 text-sm">Expiring Soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-2xl font-bold">124</p>
                      <p className="text-gray-600 text-sm">Full-time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Reports Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Available Reports</CardTitle>
                  <CardDescription>Generate various HR and compliance reports</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Employee Directory Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Shield className="h-4 w-4 mr-2" />
                    Compliance Status Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    License Expiration Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <User className="h-4 w-4 mr-2" />
                    New Hire Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                  <CardDescription>Current employee statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Employees:</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Full-time:</span>
                    <span className="font-medium">124</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Part-time:</span>
                    <span className="font-medium">32</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active:</span>
                    <span className="font-medium">152</span>
                  </div>
                  <div className="flex justify-between">
                    <span>On Leave:</span>
                    <span className="font-medium">4</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>
                    {selectedEmployee.personalInfo.firstName} {selectedEmployee.personalInfo.lastName} -{" "}
                    {selectedEmployee.employeeId}
                  </span>
                  <Badge
                    className={
                      selectedEmployee.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }
                  >
                    {selectedEmployee.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedEmployee.position} • {selectedEmployee.employmentType}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="font-medium mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm">
                        {selectedEmployee.personalInfo.firstName} {selectedEmployee.personalInfo.middleInitial}{" "}
                        {selectedEmployee.personalInfo.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Date of Birth</Label>
                      <p className="text-sm">{selectedEmployee.personalInfo.dob}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedEmployee.personalInfo.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <p className="text-sm">{selectedEmployee.personalInfo.phone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Address</Label>
                      <p className="text-sm">{selectedEmployee.personalInfo.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">SSN</Label>
                      <p className="text-sm">{selectedEmployee.personalInfo.ssn}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Information */}
                <div>
                  <h4 className="font-medium mb-3">Employment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Position</Label>
                      <p className="text-sm">{selectedEmployee.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Department</Label>
                      <p className="text-sm">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Supervisor</Label>
                      <p className="text-sm">{selectedEmployee.supervisor}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Hire Date</Label>
                      <p className="text-sm">{selectedEmployee.hireDate}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Employment Type</Label>
                      <p className="text-sm">{selectedEmployee.employmentType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Salary</Label>
                      <p className="text-sm">{selectedEmployee.salary}</p>
                    </div>
                  </div>
                </div>

                {/* Required Documents Status */}
                <div>
                  <h4 className="font-medium mb-3">Required Documents & Forms</h4>
                  <div className="space-y-4">
                    {/* Employment Forms Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-blue-700">Employment Forms</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.i9Form.status)}
                            <div>
                              <p className="font-medium text-sm">I-9 Form (Employment Eligibility)</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.i9Form.completedDate
                                  ? `Completed: ${selectedEmployee.documents.i9Form.completedDate}`
                                  : "Not completed"}
                              </p>
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.i9Form.status)}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.w4Form.status)}
                            <div>
                              <p className="font-medium text-sm">W-4 Form (Tax Withholding)</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.w4Form.completedDate
                                  ? `Completed: ${selectedEmployee.documents.w4Form.completedDate}`
                                  : "Not completed"}
                              </p>
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.w4Form.status)}
                        </div>
                      </div>
                    </div>

                    {/* Compliance Documents Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-green-700">Compliance Documents</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.hipaaAgreement.status)}
                            <div>
                              <p className="font-medium text-sm">HIPAA Privacy Agreement</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.hipaaAgreement.signedDate
                                  ? `Signed: ${selectedEmployee.documents.hipaaAgreement.signedDate}`
                                  : "Not signed"}
                              </p>
                              {selectedEmployee.documents.hipaaAgreement.expiry && (
                                <p className="text-xs text-orange-600">
                                  Expires: {selectedEmployee.documents.hipaaAgreement.expiry}
                                </p>
                              )}
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.hipaaAgreement.status)}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.confidentialityAgreement.status)}
                            <div>
                              <p className="font-medium text-sm">Confidentiality Agreement</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.confidentialityAgreement.signedDate
                                  ? `Signed: ${selectedEmployee.documents.confidentialityAgreement.signedDate}`
                                  : "Not signed"}
                              </p>
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.confidentialityAgreement.status)}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.conflictOfInterest.status)}
                            <div>
                              <p className="font-medium text-sm">Conflict of Interest Statement</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.conflictOfInterest.signedDate
                                  ? `Signed: ${selectedEmployee.documents.conflictOfInterest.signedDate}`
                                  : "Not signed"}
                              </p>
                              {selectedEmployee.documents.conflictOfInterest.expiry && (
                                <p className="text-xs text-orange-600">
                                  Review Due: {selectedEmployee.documents.conflictOfInterest.expiry}
                                </p>
                              )}
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.conflictOfInterest.status)}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.backgroundCheckAuth.status)}
                            <div>
                              <p className="font-medium text-sm">Background Check Authorization</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.backgroundCheckAuth.signedDate
                                  ? `Signed: ${selectedEmployee.documents.backgroundCheckAuth.signedDate}`
                                  : "Not signed"}
                              </p>
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.backgroundCheckAuth.status)}
                        </div>
                      </div>
                    </div>

                    {/* Health & Safety Documents Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-purple-700">Health & Safety Documents</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.tbTest.status)}
                            <div>
                              <p className="font-medium text-sm">TB Test Results</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.tbTest.date
                                  ? `Date: ${selectedEmployee.documents.tbTest.date} (${selectedEmployee.documents.tbTest.result})`
                                  : "Not completed"}
                              </p>
                              {selectedEmployee.documents.tbTest.expiry && (
                                <p className="text-xs text-orange-600">
                                  Next Due: {selectedEmployee.documents.tbTest.expiry}
                                </p>
                              )}
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.tbTest.status)}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            {getDocumentIcon(selectedEmployee.documents.tbScreeningForm.status)}
                            <div>
                              <p className="font-medium text-sm">TB Screening Form</p>
                              <p className="text-xs text-gray-500">
                                {selectedEmployee.documents.tbScreeningForm.completedDate
                                  ? `Completed: ${selectedEmployee.documents.tbScreeningForm.completedDate}`
                                  : "Not completed"}
                              </p>
                              {selectedEmployee.documents.tbScreeningForm.expiry && (
                                <p className="text-xs text-orange-600">
                                  Next Due: {selectedEmployee.documents.tbScreeningForm.expiry}
                                </p>
                              )}
                            </div>
                          </div>
                          {getDocumentStatusBadge(selectedEmployee.documents.tbScreeningForm.status)}
                        </div>
                      </div>
                    </div>

                    {/* Professional Documents Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-indigo-700">Professional Documents</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(selectedEmployee.documents)
                          .filter(([key]) =>
                            ["resume", "professionalLicense", "degree", "cprCertification"].includes(key),
                          )
                          .map(([doc, info]: [string, any]) => (
                            <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                {getDocumentIcon(info.status)}
                                <div>
                                  <p className="font-medium text-sm capitalize">{doc.replace(/([A-Z])/g, " $1")}</p>
                                  {info.number && <p className="text-xs text-gray-500">#{info.number}</p>}
                                  {info.expiry && <p className="text-xs text-orange-600">Expires: {info.expiry}</p>}
                                </div>
                              </div>
                              {getDocumentStatusBadge(info.status)}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Identity Documents Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-gray-700">Identity & Legal Documents</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(selectedEmployee.documents)
                          .filter(([key]) => ["driversLicense", "socialSecurityCard", "carInsurance"].includes(key))
                          .map(([doc, info]: [string, any]) => (
                            <div key={doc} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                {getDocumentIcon(info.status)}
                                <div>
                                  <p className="font-medium text-sm capitalize">{doc.replace(/([A-Z])/g, " $1")}</p>
                                  {info.number && <p className="text-xs text-gray-500">#{info.number}</p>}
                                  {info.expiry && <p className="text-xs text-orange-600">Expires: {info.expiry}</p>}
                                </div>
                              </div>
                              {getDocumentStatusBadge(info.status)}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Background Check Section */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-3 text-red-700">Background Verification</h5>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {getDocumentIcon(selectedEmployee.documents.backgroundCheck.status)}
                          <div>
                            <p className="font-medium text-sm">Background Check</p>
                            <p className="text-xs text-gray-500">
                              {selectedEmployee.documents.backgroundCheck.date
                                ? `Completed: ${selectedEmployee.documents.backgroundCheck.date}`
                                : "Pending"}
                            </p>
                            {selectedEmployee.documents.backgroundCheck.provider && (
                              <p className="text-xs text-gray-500">
                                Provider: {selectedEmployee.documents.backgroundCheck.provider}
                              </p>
                            )}
                          </div>
                        </div>
                        {getDocumentStatusBadge(selectedEmployee.documents.backgroundCheck.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Summary */}
                <div>
                  <h4 className="font-medium mb-3">Compliance Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">HIPAA Training</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.hipaaTraining.completed ? "✅ Completed" : "❌ Pending"}
                        {selectedEmployee.compliance.hipaaTraining.date &&
                          ` (${selectedEmployee.compliance.hipaaTraining.date})`}
                      </p>
                      {selectedEmployee.compliance.hipaaTraining.certificateNumber && (
                        <p className="text-xs text-gray-500">
                          Cert: {selectedEmployee.compliance.hipaaTraining.certificateNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">TB Screening</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.tbScreening.completed ? "✅ Completed" : "❌ Pending"}
                        {selectedEmployee.compliance.tbScreening.result &&
                          ` (${selectedEmployee.compliance.tbScreening.result})`}
                      </p>
                      {selectedEmployee.compliance.tbScreening.nextDue && (
                        <p className="text-xs text-orange-600">
                          Next Due: {selectedEmployee.compliance.tbScreening.nextDue}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Employment Eligibility (I-9)</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.employmentEligibility.verified ? "✅ Verified" : "❌ Pending"}
                        {selectedEmployee.compliance.employmentEligibility.date &&
                          ` (${selectedEmployee.compliance.employmentEligibility.date})`}
                      </p>
                      {selectedEmployee.compliance.employmentEligibility.verifiedBy && (
                        <p className="text-xs text-gray-500">
                          By: {selectedEmployee.compliance.employmentEligibility.verifiedBy}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Tax Withholding (W-4)</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.taxWithholding.completed ? "✅ Completed" : "❌ Pending"}
                        {selectedEmployee.compliance.taxWithholding.date &&
                          ` (${selectedEmployee.compliance.taxWithholding.date})`}
                      </p>
                      {selectedEmployee.compliance.taxWithholding.allowances !== undefined && (
                        <p className="text-xs text-gray-500">
                          Allowances: {selectedEmployee.compliance.taxWithholding.allowances}, Status:{" "}
                          {selectedEmployee.compliance.taxWithholding.status}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Conflict of Interest</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.conflictOfInterestDisclosure.completed
                          ? "✅ Completed"
                          : "❌ Pending"}
                        {selectedEmployee.compliance.conflictOfInterestDisclosure.date &&
                          ` (${selectedEmployee.compliance.conflictOfInterestDisclosure.date})`}
                      </p>
                      {selectedEmployee.compliance.conflictOfInterestDisclosure.nextReview && (
                        <p className="text-xs text-orange-600">
                          Review Due: {selectedEmployee.compliance.conflictOfInterestDisclosure.nextReview}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Background Check Consent</Label>
                      <p className="text-sm">
                        {selectedEmployee.compliance.backgroundCheckConsent.signed ? "✅ Signed" : "❌ Pending"}
                        {selectedEmployee.compliance.backgroundCheckConsent.date &&
                          ` (${selectedEmployee.compliance.backgroundCheckConsent.date})`}
                      </p>
                      {selectedEmployee.compliance.backgroundCheckConsent.provider && (
                        <p className="text-xs text-gray-500">
                          Provider: {selectedEmployee.compliance.backgroundCheckConsent.provider}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* In-Service Education & Training */}
                <div>
                  <h4 className="font-medium mb-3">In-Service Education & Training</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Total Training Hours (Current Year)</Label>
                      <p className="text-2xl font-bold text-blue-600">24.5 hours</p>
                      <p className="text-xs text-gray-500">Required: 20 hours annually</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Training Status</Label>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-700">Compliant</span>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Recent Training Modules</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="text-sm font-medium">HIPAA Privacy and Security</p>
                            <p className="text-xs text-gray-500">Completed: 2024-01-16</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">0.75 hrs</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="text-sm font-medium">Medication Administration</p>
                            <p className="text-xs text-gray-500">Completed: 2024-01-20</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">1.0 hrs</Badge>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <p className="text-sm font-medium">Infection Control</p>
                            <p className="text-xs text-gray-500">In Progress</p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">0.5 hrs</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competency Assessments */}
                <div>
                  <h4 className="font-medium mb-3">Competency Assessments</h4>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">Annual Competency Assessment</h5>
                          <p className="text-sm text-gray-600">Last completed: 2024-01-15</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Passed</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">Medication Administration</p>
                          <p className="text-lg font-bold text-green-600">Proficient</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Wound Care</p>
                          <p className="text-lg font-bold text-green-600">Expert</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Patient Assessment</p>
                          <p className="text-lg font-bold text-green-600">Proficient</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Documentation</p>
                          <p className="text-lg font-bold text-green-600">Expert</p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm">
                          <strong>Supervisor Notes:</strong> Demonstrates excellent clinical skills and attention to
                          detail. Recommended for advanced wound care certification.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">Skills Validation - IV Therapy</h5>
                          <p className="text-sm text-gray-600">Completed: 2023-12-10</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Validated</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium">Skill Level</p>
                          <p className="text-sm text-green-700">Competent</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Next Validation</p>
                          <p className="text-sm text-orange-600">2024-12-10</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Validator</p>
                          <p className="text-sm">Dr. Wilson, RN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Evaluations */}
                <div>
                  <h4 className="font-medium mb-3">Performance Evaluations</h4>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">Annual Performance Review 2024</h5>
                          <p className="text-sm text-gray-600">Evaluation Date: 2024-01-10</p>
                          <p className="text-sm text-gray-600">Supervisor: Dr. Wilson</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg">4.2/5.0</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Exceeds Expectations</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">Clinical Skills</p>
                          <div className="flex justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= 4 ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">4.0/5.0</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">Communication</p>
                          <div className="flex justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= 5 ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">5.0/5.0</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">Professional Development</p>
                          <div className="flex justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= 4 ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">4.0/5.0</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium">Quality of Care</p>
                          <div className="flex justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= 4 ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">4.0/5.0</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 rounded">
                          <p className="text-sm font-medium text-green-800">Strengths</p>
                          <p className="text-sm text-green-700 mt-1">
                            Excellent patient communication skills, strong clinical knowledge, reliable team member,
                            proactive in identifying patient needs.
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded">
                          <p className="text-sm font-medium text-blue-800">Development Goals</p>
                          <p className="text-sm text-blue-700 mt-1">
                            Continue advanced wound care training, consider leadership development opportunities,
                            maintain current performance standards.
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded">
                          <p className="text-sm font-medium text-yellow-800">Next Review</p>
                          <p className="text-sm text-yellow-700 mt-1">Scheduled for January 10, 2025</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">90-Day Probationary Review</h5>
                          <p className="text-sm text-gray-600">Evaluation Date: 2024-04-15</p>
                          <p className="text-sm text-gray-600">Supervisor: Dr. Wilson</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1 mb-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-bold text-lg">3.8/5.0</span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">Meets Expectations</Badge>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <p className="text-sm">
                          <strong>Summary:</strong> Successfully completed probationary period. Shows strong potential
                          and commitment to quality patient care. Recommended for permanent position.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="font-medium mb-3">Education</h4>
                  <div className="space-y-3">
                    {selectedEmployee.education.highSchool && (
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">High School</h5>
                        <p className="text-sm text-gray-600">{selectedEmployee.education.highSchool.name}</p>
                        <p className="text-xs text-gray-500">
                          Graduated: {selectedEmployee.education.highSchool.graduated ? "Yes" : "No"} (
                          {selectedEmployee.education.highSchool.year})
                        </p>
                      </div>
                    )}
                    {selectedEmployee.education.college && (
                      <div className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">College</h5>
                        <p className="text-sm text-gray-600">{selectedEmployee.education.college.name}</p>
                        <p className="text-sm text-gray-600">{selectedEmployee.education.college.degree}</p>
                        <p className="text-xs text-gray-500">
                          Graduated: {selectedEmployee.education.college.graduated ? "Yes" : "No"} (
                          {selectedEmployee.education.college.year})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work History */}
                <div>
                  <h4 className="font-medium mb-3">Work History</h4>
                  <div className="space-y-3">
                    {selectedEmployee.workHistory.map((job: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-sm">{job.company}</h5>
                            <p className="text-sm text-gray-600">{job.position}</p>
                            <p className="text-xs text-gray-500">
                              Supervisor: {job.supervisor} • {job.phone}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{job.duration}</p>
                            <p className="text-xs text-gray-500">Left: {job.reason}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* References */}
                <div>
                  <h4 className="font-medium mb-3">References</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedEmployee.references.map((ref: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h5 className="font-medium text-sm">{ref.name}</h5>
                        <p className="text-sm text-gray-600">{ref.relationship}</p>
                        <p className="text-sm text-gray-600">{ref.company}</p>
                        <p className="text-xs text-gray-500">{ref.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h4 className="font-medium mb-3">Emergency Contact</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Name</Label>
                        <p className="text-sm">{selectedEmployee.emergencyContact.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Relationship</Label>
                        <p className="text-sm">{selectedEmployee.emergencyContact.relationship}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm">{selectedEmployee.emergencyContact.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm">{selectedEmployee.emergencyContact.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Employee
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Employee
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export File
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print File
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
