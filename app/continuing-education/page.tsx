"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  BookOpen,
  Calendar,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  Award,
  Users,
  TrendingUp,
  Shield,
  Bell,
  Lock,
  Unlock,
  Eye,
  Edit,
  Loader2,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { CertificateModal } from "@/components/training/CertificateModal"

export default function ContinuingEducation() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [complianceFilter, setComplianceFilter] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [viewingCertificate, setViewingCertificate] = useState<any>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<any>(null)
  const [previewingModule, setPreviewingModule] = useState<any>(null)
  const [editModuleDialogOpen, setEditModuleDialogOpen] = useState(false)
  const [previewModuleDialogOpen, setPreviewModuleDialogOpen] = useState(false)
  
  // Training form state (same as in-service)
  const [trainingForm, setTrainingForm] = useState({
    title: "",
    category: "",
    description: "",
    duration: "",
    ceuHours: "",
    difficulty: "",
    targetRoles: [] as string[],
    mandatory: "false",
    type: "online_course",
  })
  const [isSubmittingTraining, setIsSubmittingTraining] = useState(false)
  const [trainingError, setTrainingError] = useState<string | null>(null)
  
  // Training modules state (same as in-service)
  const [trainingModules, setTrainingModules] = useState<Array<{
    id: string
    title: string
    duration: number
    file: File | null
    fileName: string
    fileUrl?: string
  }>>([])

  // Real data states
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<any[]>([])
  const [stateRequirements, setStateRequirements] = useState<any>({})
  const [onboardingModules, setOnboardingModules] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [completions, setCompletions] = useState<any[]>([])
  const [complianceStats, setComplianceStats] = useState({
    total: 0,
    compliant: 0,
    atRisk: 0,
    dueSoon: 0,
    nonCompliant: 0,
    lockedOut: 0,
  })

  // Fetch real data from API
  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔄 Fetching continuing education data from API...")
      const response = await fetch("/api/continuing-education/data")
      const data = await response.json()
      
      if (data.success) {
        console.log("✅ Data fetched successfully!")
        console.log("📊 Compliance Stats from Database:", data.stats)
        console.log("👥 Total Employees:", data.employees?.length || 0)
        console.log("📝 Enrollments:", data.enrollments?.length || 0)
        console.log("✅ Completions:", data.completions?.length || 0)
        
        setEmployees(data.employees || [])
        setStateRequirements({ michigan: data.stateRequirements || {} })
        setOnboardingModules(data.onboardingModules || [])
        setEnrollments(data.enrollments || [])
        setCompletions(data.completions || [])
        setComplianceStats(data.stats || {
          total: 0,
          compliant: 0,
          atRisk: 0,
          dueSoon: 0,
          nonCompliant: 0,
          lockedOut: 0,
        })
        
        console.log("💾 Stats set in state:", {
          total: data.stats?.total || 0,
          compliant: data.stats?.compliant || 0,
          atRisk: data.stats?.atRisk || 0,
          dueSoon: data.stats?.dueSoon || 0,
          nonCompliant: data.stats?.nonCompliant || 0,
          lockedOut: data.stats?.lockedOut || 0,
        })
      }
    } catch (error) {
      console.error("❌ Error fetching continuing education data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle certificate upload
  const [uploadingCertificate, setUploadingCertificate] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleCertificateUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploadingCertificate(true)
    setUploadError("")
    setUploadSuccess(false)

    try {
      const form = e.currentTarget
      const formData = new FormData(form)
      
      const response = await fetch("/api/continuing-education/upload-certificate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setUploadSuccess(true)
        setUploadDialogOpen(false)
        // Refresh data to show updated certificates
        fetchData()
        // Reset form
        form.reset()
      } else {
        setUploadError(data.error || "Failed to upload certificate")
      }
    } catch (error) {
      console.error("Error uploading certificate:", error)
      setUploadError("An error occurred while uploading the certificate")
    } finally {
      setUploadingCertificate(false)
    }
  }

  const handleViewCertificate = (cert: any) => {
    setViewingCertificate({
      staffName: selectedEmployee.name,
      trainingTitle: cert.title,
      completionDate: cert.completionDate,
      ceuHours: cert.hoursEarned,
      score: cert.score || null,
      certificateId: cert.certificateNumber || `CERT-${cert.id}`,
      staffId: selectedEmployee.id,
    })
  }

  const handleEditModule = (module: any) => {
    // Populate form with existing module data (same as in-service)
    setTrainingForm({
      title: module.title || "",
      category: module.category || "",
      description: module.description || "",
      duration: module.estimatedTime?.toString() || "",
      ceuHours: "0", // Onboarding modules may not have CEU hours
      difficulty: "beginner", // Default for onboarding
      targetRoles: Array.isArray(module.roles) ? module.roles : (module.roles ? [module.roles] : []),
      mandatory: module.required ? "true" : "false",
      type: "online_course",
    })
    
    // Load existing modules if available (from in_service_trainings.modules JSONB field)
    if (module.modules && Array.isArray(module.modules) && module.modules.length > 0) {
      const existingModules = module.modules.map((m: any) => ({
        id: m.id || `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: m.title || "",
        duration: m.duration || 0,
        file: null as File | null,
        fileName: m.fileName || "",
        fileUrl: m.fileUrl || undefined,
      }))
      setTrainingModules(existingModules)
    } else {
      setTrainingModules([])
    }
    
    setEditingModule(module)
    setTrainingError(null)
    setEditModuleDialogOpen(true)
  }

  const handlePreviewModule = (module: any) => {
    setPreviewingModule(module)
    setPreviewModuleDialogOpen(true)
  }

  const handleSaveModuleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!trainingForm.title || !trainingForm.category || !trainingForm.description || 
        !trainingForm.duration || !trainingForm.targetRoles || trainingForm.targetRoles.length === 0) {
      setTrainingError("Please fill in all required fields, including at least one target role")
      return
    }

    // Validate modules
    if (trainingModules.length > 0) {
      const invalidModules = trainingModules.filter(
        (m) => !m.title || !m.duration || (!m.file && !m.fileUrl)
      )
      if (invalidModules.length > 0) {
        setTrainingError("Please fill in all module fields (title, duration, and file) for all modules. When editing, existing files are preserved.")
        return
      }
    }

    if (!editingModule || !editingModule.id) {
      setTrainingError("Module ID is missing. Cannot update.")
      return
    }

    setIsSubmittingTraining(true)
    setTrainingError(null)

    try {
      // Upload module files first if any (same as in-service)
      const uploadedModules: any[] = []
      
      if (trainingModules.length > 0) {
        for (const module of trainingModules) {
          if (module.file) {
            // Upload file to storage
            const moduleFormData = new FormData()
            moduleFormData.append("file", module.file)
            moduleFormData.append("type", "training_module")
            
            try {
              console.log(`Uploading module file: ${module.fileName} (${module.file.size} bytes)`)
              const uploadResponse = await fetch("/api/in-service/trainings/upload-module", {
                method: "POST",
                body: moduleFormData,
              })
              
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text()
                console.error("Upload failed with status:", uploadResponse.status, errorText)
                throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`)
              }
              
              const uploadResult = await uploadResponse.json()
              console.log("Upload result:", uploadResult)
              
              if (uploadResult.success && uploadResult.fileUrl) {
                uploadedModules.push({
                  id: module.id,
                  title: module.title,
                  duration: module.duration,
                  fileUrl: uploadResult.fileUrl,
                  fileName: uploadResult.fileName || module.fileName,
                })
                console.log(`✓ Module file uploaded: ${uploadResult.fileName} -> ${uploadResult.fileUrl}`)
              } else {
                const errorMsg = uploadResult.error || "Unknown upload error"
                console.error("Upload failed:", errorMsg)
                throw new Error(`Failed to upload file: ${errorMsg}`)
              }
            } catch (uploadError: any) {
              console.error("Error uploading module file:", uploadError)
              setTrainingError(`Failed to upload module file "${module.fileName}": ${uploadError.message || "Unknown error"}`)
              setIsSubmittingTraining(false)
              return
            }
          } else if (module.fileUrl) {
            // Module already has a fileUrl (when editing and not changing the file)
            console.log(`Module already has fileUrl, preserving: ${module.fileUrl}`)
            uploadedModules.push({
              id: module.id,
              title: module.title,
              duration: module.duration,
              fileUrl: module.fileUrl,
              fileName: module.fileName,
            })
          } else {
            // Module without file and no fileUrl
            console.error("Module missing both file and fileUrl:", module)
            setTrainingError(`Module "${module.title}" is missing a file. Please upload a file or remove this module.`)
            setIsSubmittingTraining(false)
            return
          }
        }
      }

      const formData = {
        title: trainingForm.title,
        category: trainingForm.category,
        description: trainingForm.description,
        duration: parseInt(trainingForm.duration),
        ceuHours: parseFloat(trainingForm.ceuHours) || 0,
        difficulty: trainingForm.difficulty || "beginner",
        targetRoles: trainingForm.targetRoles.includes("all") ? ["All"] : trainingForm.targetRoles,
        type: trainingForm.type || "online_course",
        mandatory: trainingForm.mandatory === "true",
        modules: uploadedModules.length > 0 ? uploadedModules : (editingModule.modules || []),
      }

      const response = await fetch("/api/in-service/trainings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainingId: editingModule.id, ...formData }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("Training updated successfully:", data.training)
        setEditModuleDialogOpen(false)
        setEditingModule(null)
        setTrainingModules([])
        setTrainingForm({
          title: "",
          category: "",
          description: "",
          duration: "",
          ceuHours: "",
          difficulty: "",
          targetRoles: [],
          mandatory: "false",
          type: "online_course",
        })
        // Refresh data
        await fetchData()
      } else {
        setTrainingError(data.error || "Failed to update training")
      }
    } catch (error: any) {
      console.error("Error updating training:", error)
      setTrainingError(error.message || "An error occurred while updating the training")
    } finally {
      setIsSubmittingTraining(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800"
      case "at_risk":
        return "bg-yellow-100 text-yellow-800"
      case "due_soon":
        return "bg-orange-100 text-orange-800"
      case "non_compliant":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "at_risk":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "due_soon":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "non_compliant":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || emp.role === roleFilter
    const matchesCompliance = complianceFilter === "all" || emp.status === complianceFilter
    return matchesSearch && matchesRole && matchesCompliance
  })

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading continuing education data...</p>
        </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Continuing Education & Compliance</h1>
                <p className="text-gray-600">State-compliant CEU tracking and mandatory training management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload CEU Certificate</DialogTitle>
                    <DialogDescription>Upload a continuing education certificate for verification</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCertificateUpload} className="space-y-4">
                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{uploadError}</p>
                      </div>
                    )}
                    {uploadSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">Certificate uploaded successfully!</p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="employeeId">Employee *</Label>
                      <select
                        id="employeeId"
                        name="employeeId"
                        required
                        className="w-full border border-gray-300 rounded-md p-2"
                      >
                        <option value="">Select employee</option>
                          {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.role})
                          </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="title">Course Title *</Label>
                      <Input id="title" name="title" placeholder="Enter course title" required />
                    </div>
                    <div>
                      <Label htmlFor="provider">Provider *</Label>
                      <Input id="provider" name="provider" placeholder="Training provider name" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="completionDate">Completion Date *</Label>
                        <Input id="completionDate" name="completionDate" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="hoursEarned">Hours Earned *</Label>
                        <Input
                          id="hoursEarned"
                          name="hoursEarned"
                          type="number"
                          step="0.5"
                          placeholder="0.0"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="certificate">Certificate File (Optional)</Label>
                      <Input id="certificate" name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadingCertificate}>
                        {uploadingCertificate ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Certificate
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employee Tracking</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="requirements">State Requirements</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Compliance Statistics */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Compliance Statistics</h2>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse" />
                Live Data
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{complianceStats.total}</div>
                  <div className="text-sm text-gray-600">Total Staff</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{complianceStats.compliant}</div>
                  <div className="text-sm text-gray-600">Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{complianceStats.atRisk}</div>
                  <div className="text-sm text-gray-600">At Risk</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{complianceStats.dueSoon}</div>
                  <div className="text-sm text-gray-600">Due Soon</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</div>
                  <div className="text-sm text-gray-600">Non-Compliant</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{complianceStats.lockedOut}</div>
                  <div className="text-sm text-gray-600">Locked Out</div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Urgent Actions Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employees
                    .filter((emp) => emp.status === "non_compliant" || emp.workRestrictions.length > 0)
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-red-800">{emp.name}</p>
                          <p className="text-sm text-red-600">
                            {emp.status === "non_compliant" && "CEU requirements overdue"}
                            {emp.workRestrictions.length > 0 && " • Work restrictions active"}
                          </p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {emp.status === "non_compliant" ? "Overdue" : "Restricted"}
                        </Badge>
                      </div>
                    ))}
                  {employees.filter((emp) => emp.status === "non_compliant" || emp.workRestrictions.length > 0)
                    .length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No urgent actions required
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-orange-500" />
                    Due Soon (Next 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {employees
                    .filter((emp) => emp.status === "due_soon" && emp.daysUntilDue <= 30)
                    .map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-orange-800">{emp.name}</p>
                          <p className="text-sm text-orange-600">
                            {emp.requiredHours - emp.completedHours} hours needed in {emp.daysUntilDue} days
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">{emp.daysUntilDue} days</Badge>
                      </div>
                    ))}
                  {employees.filter((emp) => emp.status === "due_soon" && emp.daysUntilDue <= 30).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No CEUs due in next 30 days
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Compliance Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance Rate</CardTitle>
                <CardDescription>Percentage of staff meeting CEU requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">
                      {Math.round((complianceStats.compliant / complianceStats.total) * 100)}% Compliant
                    </span>
                    <span className="text-sm text-gray-600">
                      {complianceStats.compliant} of {complianceStats.total} employees
                    </span>
                  </div>
                  <Progress value={(complianceStats.compliant / complianceStats.total) * 100} className="h-3" />
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-green-600 font-medium">{complianceStats.compliant}</div>
                      <div className="text-gray-500">Compliant</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-600 font-medium">{complianceStats.atRisk}</div>
                      <div className="text-gray-500">At Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-orange-600 font-medium">{complianceStats.dueSoon}</div>
                      <div className="text-gray-500">Due Soon</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">{complianceStats.nonCompliant}</div>
                      <div className="text-gray-500">Overdue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="RN">RN</SelectItem>
                        <SelectItem value="LPN">LPN</SelectItem>
                        <SelectItem value="CNA">CNA</SelectItem>
                        <SelectItem value="PT">PT</SelectItem>
                        <SelectItem value="PTA">PTA</SelectItem>
                        <SelectItem value="OT">OT</SelectItem>
                        <SelectItem value="HHA">HHA</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Compliance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="compliant">Compliant</SelectItem>
                        <SelectItem value="at_risk">At Risk</SelectItem>
                        <SelectItem value="due_soon">Due Soon</SelectItem>
                        <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Employee List */}
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{employee.name}</h3>
                            <Badge variant="outline">{employee.role}</Badge>
                            {employee.workRestrictions.length > 0 && (
                              <Badge className="bg-red-100 text-red-800">
                                <Lock className="h-3 w-3 mr-1" />
                                Restricted
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>
                              {employee.completedHours} / {employee.requiredHours} hours completed
                            </span>
                            <span>•</span>
                            <span>
                              {employee.daysUntilDue > 0
                                ? `${employee.daysUntilDue} days remaining`
                                : `${Math.abs(employee.daysUntilDue)} days overdue`}
                            </span>
                          </div>
                          <div className="mt-2">
                            <Progress
                              value={(employee.completedHours / employee.requiredHours) * 100}
                              className="h-2 w-64"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(employee.status)}
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEmployee(employee)}>
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

          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mandatory Onboarding Modules</CardTitle>
                <CardDescription>Required training for all new employees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onboardingModules.map((module) => (
                    <div key={module.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{module.title}</h3>
                            {module.required && <Badge className="bg-red-100 text-red-800">Required</Badge>}
                            {module.roles && <Badge variant="outline">{module.roles.join(", ")} only</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {module.estimatedTime} minutes
                            </span>
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due within {module.dueWithin} days
                            </span>
                            <span className="flex items-center">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {module.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditModule(module)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePreviewModule(module)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Onboarding Progress by Employee */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Onboarding Progress</CardTitle>
                <CardDescription>Track completion of mandatory training modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{employee.name}</h3>
                              <Badge variant="outline">{employee.role}</Badge>
                              {(() => {
                                const progressPercent = employee.onboardingStatus.totalModules > 0
                                  ? (employee.onboardingStatus.completedModules / employee.onboardingStatus.totalModules) * 100
                                  : 0
                                
                                if (progressPercent === 100) {
                                  return (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                                  )
                                } else if (progressPercent > 0) {
                                  return (
                                    <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="h-3 w-3 mr-1" />
                                      In Progress ({Math.round(progressPercent)}%)
                                </Badge>
                                  )
                                } else {
                                  return (
                                    <Badge className="bg-gray-100 text-gray-800">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Not Started
                                    </Badge>
                                  )
                                }
                              })()}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {employee.onboardingStatus.completedModules} of {employee.onboardingStatus.totalModules}{" "}
                              modules completed
                              {employee.onboardingStatus.completionDate &&
                                ` • Completed ${employee.onboardingStatus.completionDate}`}
                            </div>
                            <div className="mt-2">
                              <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                    (() => {
                                      const progressPercent = employee.onboardingStatus.totalModules > 0
                                        ? (employee.onboardingStatus.completedModules / employee.onboardingStatus.totalModules) * 100
                                        : 0
                                      
                                      if (progressPercent === 100) return "bg-green-500"
                                      else if (progressPercent >= 75) return "bg-green-400"
                                      else if (progressPercent >= 50) return "bg-yellow-500"
                                      else if (progressPercent >= 25) return "bg-orange-500"
                                      else if (progressPercent > 0) return "bg-red-400"
                                      else return "bg-gray-400"
                                    })()
                                  }`}
                                  style={{
                                    width: `${
                                      employee.onboardingStatus.totalModules > 0
                                        ? (employee.onboardingStatus.completedModules / employee.onboardingStatus.totalModules) * 100
                                        : 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!employee.onboardingStatus.completed && employee.workRestrictions.length > 0 && (
                            <Badge className="bg-red-100 text-red-800">
                              <Lock className="h-3 w-3 mr-1" />
                              Work Restricted
                            </Badge>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Michigan State CEU Requirements</CardTitle>
                <CardDescription>Continuing education requirements by professional role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(stateRequirements.michigan).map(([role, req]) => (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{role}</h3>
                        <Badge variant="outline">{req.period}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Required Hours:</span>
                          <span className="font-medium">{req.hours}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Period:</span>
                          <span className="font-medium">{req.period}</span>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm">{req.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Enforcement Rules</CardTitle>
                <CardDescription>Automatic restrictions and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <h3 className="font-medium">30 Days Before Due Date</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      System flags employee as "Due Soon" and sends email reminder to complete CEU requirements.
                    </p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <h3 className="font-medium">Past Due Date</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Employee marked as "Non-Compliant" and automatically restricted from:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 mt-2 ml-4">
                      <li>New patient assignments</li>
                      <li>Shift scheduling</li>
                      <li>Payroll processing</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Unlock className="h-5 w-5 text-green-500" />
                      <h3 className="font-medium">Compliance Restoration</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Once CEU requirements are met and certificates verified, all restrictions are automatically lifted
                      and employee returns to active status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Real-time Analytics Badge */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Reports & Analytics</h2>
                <p className="text-sm text-gray-600">Real-time compliance and training metrics</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <div className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse" />
                Live Data
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Reports</CardTitle>
                  <CardDescription>Generate reports for audits and surveys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      const reportData = employees.map(emp => ({
                        name: emp.name,
                        role: emp.role,
                        status: emp.status,
                        completed: emp.completedHours,
                        required: emp.requiredHours,
                        percentage: Math.round((emp.completedHours / emp.requiredHours) * 100),
                        daysRemaining: emp.daysUntilDue
                      }))
                      console.log("CEU Compliance Summary:", reportData)
                      alert(`CEU Compliance Summary:\n\nCompliant: ${complianceStats.compliant}/${complianceStats.total}\nAt Risk: ${complianceStats.atRisk}\nNon-Compliant: ${complianceStats.nonCompliant}\n\nSee console for detailed data.`)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CEU Compliance Summary
                    <Badge variant="outline" className="ml-auto text-xs">
                      {complianceStats.total} staff
                    </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      const trainingRecords = employees.map(emp => ({
                        name: emp.name,
                        role: emp.role,
                        certificates: emp.certificates.length,
                        totalCEUHours: emp.completedHours,
                        onboardingComplete: emp.onboardingStatus.completed,
                        onboardingProgress: `${emp.onboardingStatus.completedModules}/${emp.onboardingStatus.totalModules}`
                      }))
                      console.log("Employee Training Records:", trainingRecords)
                      alert(`Employee Training Records:\n\nTotal Employees: ${employees.length}\nTotal Certificates: ${employees.reduce((sum, emp) => sum + emp.certificates.length, 0)}\n\nSee console for detailed records.`)
                    }}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Employee Training Records
                    <Badge variant="outline" className="ml-auto text-xs">
                      {employees.reduce((sum, emp) => sum + emp.certificates.length, 0)} certs
                    </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      const upcomingExpirations = employees.filter(emp => 
                        emp.status === "due_soon" && emp.daysUntilDue <= 30
                      ).map(emp => ({
                        name: emp.name,
                        role: emp.role,
                        daysRemaining: emp.daysUntilDue,
                        hoursNeeded: emp.requiredHours - emp.completedHours,
                        dueDate: emp.currentPeriodEnd
                      }))
                      console.log("Upcoming Expirations:", upcomingExpirations)
                      alert(`Upcoming Expirations (Next 30 Days):\n\n${upcomingExpirations.length} staff members\n\nSee console for detailed list.`)
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Expiration Report
                    <Badge variant="outline" className="ml-auto text-xs text-orange-600">
                      {employees.filter(emp => emp.status === "due_soon" && emp.daysUntilDue <= 30).length} upcoming
                    </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      const auditReport = {
                        totalStaff: complianceStats.total,
                        compliantStaff: complianceStats.compliant,
                        complianceRate: Math.round((complianceStats.compliant / complianceStats.total) * 100),
                        nonCompliant: complianceStats.nonCompliant,
                        lockedOut: complianceStats.lockedOut,
                        stateRequirements: stateRequirements.michigan,
                        employeeBreakdown: employees.map(emp => ({
                          name: emp.name,
                          role: emp.role,
                          status: emp.status,
                          completedHours: emp.completedHours,
                          requiredHours: emp.requiredHours,
                          periodEnd: emp.currentPeriodEnd,
                          restrictions: emp.workRestrictions
                        }))
                      }
                      console.log("State Audit Report:", auditReport)
                      alert(`State Audit Report:\n\nCompliance Rate: ${Math.round((complianceStats.compliant / complianceStats.total) * 100)}%\nCompliant: ${complianceStats.compliant}/${complianceStats.total}\nNon-Compliant: ${complianceStats.nonCompliant}\n\nSee console for full audit data.`)
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    State Audit Report
                    <Badge variant="outline" className="ml-auto text-xs text-green-600">
                      {Math.round((complianceStats.compliant / complianceStats.total) * 100)}% compliant
                    </Badge>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      const verificationLog = employees.flatMap(emp => 
                        emp.certificates.map(cert => ({
                          employeeName: emp.name,
                          employeeRole: emp.role,
                          trainingTitle: cert.title,
                          provider: cert.provider,
                          completionDate: cert.completionDate,
                          hoursEarned: cert.hoursEarned,
                          certificateNumber: cert.certificateNumber,
                          status: cert.status
                        }))
                      )
                      console.log("Certificate Verification Log:", verificationLog)
                      alert(`Certificate Verification Log:\n\nTotal Certificates: ${verificationLog.length}\nVerified: ${verificationLog.filter(c => c.status === "verified").length}\n\nSee console for complete log.`)
                    }}
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Certificate Verification Log
                    <Badge variant="outline" className="ml-auto text-xs">
                      {employees.reduce((sum, emp) => sum + emp.certificates.filter(c => c.status === "verified").length, 0)} verified
                    </Badge>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>Training and compliance metrics from real data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Calculate real analytics
                      const avgComplianceRate = complianceStats.total > 0 
                        ? Math.round((complianceStats.compliant / complianceStats.total) * 100)
                        : 0
                      
                      // Count certificates uploaded this month
                      const currentMonth = new Date().getMonth()
                      const currentYear = new Date().getFullYear()
                      const certificatesThisMonth = employees.reduce((sum, emp) => {
                        return sum + emp.certificates.filter(cert => {
                          const certDate = new Date(cert.completionDate)
                          return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear
                        }).length
                      }, 0)
                      
                      // Calculate average hours per employee
                      const totalHours = employees.reduce((sum, emp) => sum + emp.completedHours, 0)
                      const avgHoursPerEmployee = employees.length > 0 
                        ? (totalHours / employees.length).toFixed(1)
                        : 0
                      
                      // Calculate onboarding completion rate
                      const completedOnboarding = employees.filter(emp => emp.onboardingStatus.completed).length
                      const onboardingRate = employees.length > 0
                        ? Math.round((completedOnboarding / employees.length) * 100)
                        : 0
                      
                      return (
                        <>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Average Compliance Rate</span>
                              <p className="text-xs text-gray-500 mt-1">
                                {complianceStats.compliant} of {complianceStats.total} staff compliant
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{avgComplianceRate}%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Certificates This Month</span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">{certificatesThisMonth}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Average Hours Per Employee</span>
                              <p className="text-xs text-gray-500 mt-1">
                                Total: {totalHours.toFixed(1)} hours across {employees.length} staff
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">{avgHoursPerEmployee}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Onboarding Completion Rate</span>
                              <p className="text-xs text-gray-500 mt-1">
                                {completedOnboarding} of {employees.length} completed mandatory training
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-orange-600">{onboardingRate}%</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>Download reports in various formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent hover:bg-green-50"
                    onClick={() => {
                      // Generate CSV data
                      const csvData = [
                        ['Name', 'Role', 'Status', 'Completed Hours', 'Required Hours', 'Completion %', 'Days Until Due', 'Certificates', 'Onboarding Status'].join(','),
                        ...employees.map(emp => [
                          emp.name,
                          emp.role,
                          emp.status,
                          emp.completedHours,
                          emp.requiredHours,
                          Math.round((emp.completedHours / emp.requiredHours) * 100),
                          emp.daysUntilDue,
                          emp.certificates.length,
                          emp.onboardingStatus.completed ? 'Complete' : 'In Progress'
                        ].join(','))
                      ].join('\n')
                      
                      // Create and download file
                      const blob = new Blob([csvData], { type: 'text/csv' })
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `ceu-compliance-report-${new Date().toISOString().split('T')[0]}.csv`
                      a.click()
                      window.URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="h-6 w-6 mb-2" />
                    <span>Excel Report</span>
                    <span className="text-xs text-gray-500">Detailed spreadsheet (CSV)</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent hover:bg-blue-50"
                    onClick={() => {
                      // Calculate additional statistics
                      const totalCertificates = employees.reduce((sum, emp) => sum + emp.certificates.length, 0)
                      const totalHours = employees.reduce((sum, emp) => sum + emp.completedHours, 0)
                      const avgHours = employees.length > 0 ? (totalHours / employees.length).toFixed(1) : 0
                      const completedOnboarding = employees.filter(emp => emp.onboardingStatus.completed).length
                      
                      // Group employees by status
                      const compliantEmp = employees.filter(e => e.status === 'compliant')
                      const atRiskEmp = employees.filter(e => e.status === 'at_risk')
                      const dueSoonEmp = employees.filter(e => e.status === 'due_soon')
                      const nonCompliantEmp = employees.filter(e => e.status === 'non_compliant')
                      
                      // Calculate compliance rate
                      const complianceRate = Math.round((complianceStats.compliant / complianceStats.total) * 100)
                      
                      // Generate HTML for PDF (browser will convert)
                      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CEU Compliance Summary Report - ${new Date().toISOString().split('T')[0]}</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      font-size: 24px;
      margin: 0 0 10px 0;
    }
    .header .meta {
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      background: #efe6;
      color: #1e40af;
      padding: 10px 15px;
      font-size: 18px;
      font-weight: bold;
      border-left: 4px solid #2563eb;
      margin: 20px 0 15px 0;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .summary-item {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #cbd5e1;
    }
    .summary-item.compliant { border-left-color: #10b981; }
    .summary-item.at-risk { border-left-color: #eab308; }
    .summary-item.due-soon { border-left-color: #f59e0b; }
    .summary-item.non-compliant { border-left-color: #ef4444; }
    .summary-item strong {
      display: block;
      font-size: 24px;
      color: #1e293b;
      margin-bottom: 5px;
    }
    .summary-item label {
      color: #64748b;
      font-size: 14px;
    }
    .employee-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 15px;
      page-break-inside: avoid;
    }
    .employee-card.compliant { border-left: 4px solid #10b981; }
    .employee-card.at-risk { border-left: 4px solid #eab308; }
    .employee-card.due-soon { border-left: 4px solid #f59e0b; }
    .employee-card.non-compliant { border-left: 4px solid #ef4444; }
    .employee-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .employee-name {
      font-size: 16px;
      font-weight: bold;
      color: #1e293b;
    }
    .employee-role {
      color: #64748b;
      font-size: 14px;
    }
    .employee-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .status-compliant { background: #dcfce7; color: #166534; }
    .status-at-risk { background: #fef9c3; color: #854d0e; }
    .status-due-soon { background: #fed7aa; color: #9a3412; }
    .status-non-compliant { background: #fee2e2; color: #991b1b; }
    .employee-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 13px;
      color: #475569;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .detail-label {
      color: #64748b;
    }
    .detail-value {
      font-weight: 500;
      color: #1e293b;
    }
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 12px;
      margin-top: 10px;
      color: #991b1b;
      font-size: 13px;
    }
    .recommendations {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .recommendations h4 {
      margin: 0 0 10px 0;
      color: #92400e;
    }
    .recommendations ul {
      margin: 0;
      padding-left: 20px;
    }
    .recommendations li {
      margin: 8px 0;
      color: #78350f;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 13px;
    }
    table th {
      background: #f1f5f9;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      color: #475569;
    }
    table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CEU COMPLIANCE SUMMARY REPORT</h1>
    <div class="meta">
      Generated: ${new Date().toLocaleString()} | Report Period: ${new Date().getFullYear()}
    </div>
  </div>

  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="summary-grid">
      <div class="summary-item">
        <strong>${complianceStats.total}</strong>
        <label>Total Staff Members</label>
      </div>
      <div class="summary-item compliant">
        <strong>${complianceRate}%</strong>
        <label>Overall Compliance Rate</label>
      </div>
      <div class="summary-item compliant">
        <strong>${complianceStats.compliant}</strong>
        <label>Compliant Staff (${Math.round((complianceStats.compliant / complianceStats.total) * 100)}%)</label>
      </div>
      <div class="summary-item at-risk">
        <strong>${complianceStats.atRisk}</strong>
        <label>At Risk (${Math.round((complianceStats.atRisk / complianceStats.total) * 100)}%)</label>
      </div>
      <div class="summary-item due-soon">
        <strong>${complianceStats.dueSoon}</strong>
        <label>Due Soon (${Math.round((complianceStats.dueSoon / complianceStats.total) * 100)}%)</label>
      </div>
      <div class="summary-item non-compliant">
        <strong>${complianceStats.nonCompliant}</strong>
        <label>Non-Compliant (${Math.round((complianceStats.nonCompliant / complianceStats.total) * 100)}%)</label>
      </div>
    </div>

    <table>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Total CEU Hours Completed</td>
        <td>${totalHours.toFixed(1)} hours</td>
      </tr>
      <tr>
        <td>Average Hours per Employee</td>
        <td>${avgHours} hours</td>
      </tr>
      <tr>
        <td>Total Certificates Issued</td>
        <td>${totalCertificates}</td>
      </tr>
      <tr>
        <td>Onboarding Completion Rate</td>
        <td>${Math.round((completedOnboarding / employees.length) * 100)}% (${completedOnboarding}/${employees.length})</td>
      </tr>
      <tr>
        <td>Work Restrictions Active</td>
        <td>${complianceStats.lockedOut} staff</td>
      </tr>
    </table>
  </div>

  ${compliantEmp.length > 0 ? `
  <div class="section">
    <div class="section-title">✓ Compliant Staff (${compliantEmp.length})</div>
    ${compliantEmp.map(emp => `
      <div class="employee-card compliant">
        <div class="employee-header">
          <div>
            <div class="employee-name">${emp.name}</div>
            <div class="employee-role">${emp.role}</div>
          </div>
          <span class="employee-status status-compliant">COMPLIANT</span>
        </div>
        <div class="employee-details">
          <div class="detail-row">
            <span class="detail-label">CEU Hours:</span>
            <span class="detail-value">${emp.completedHours}/${emp.requiredHours} (${Math.round((emp.completedHours / emp.requiredHours) * 100)}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Days Remaining:</span>
            <span class="detail-value">${emp.daysUntilDue} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Certificates:</span>
            <span class="detail-value">${emp.certificates.length}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Onboarding:</span>
            <span class="detail-value">${emp.onboardingStatus.completed ? 'Complete' : `${emp.onboardingStatus.completedModules}/${emp.onboardingStatus.totalModules} modules`}</span>
          </div>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${atRiskEmp.length > 0 ? `
  <div class="section">
    <div class="section-title">⚠ At Risk Staff (${atRiskEmp.length})</div>
    ${atRiskEmp.map(emp => `
      <div class="employee-card at-risk">
        <div class="employee-header">
          <div>
            <div class="employee-name">${emp.name}</div>
            <div class="employee-role">${emp.role}</div>
          </div>
          <span class="employee-status status-at-risk">AT RISK</span>
        </div>
        <div class="employee-details">
          <div class="detail-row">
            <span class="detail-label">CEU Hours:</span>
            <span class="detail-value">${emp.completedHours}/${emp.requiredHours} (${Math.round((emp.completedHours / emp.requiredHours) * 100)}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Hours Needed:</span>
            <span class="detail-value">${(emp.requiredHours - emp.completedHours).toFixed(1)} hours</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Days Remaining:</span>
            <span class="detail-value">${emp.daysUntilDue} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Certificates:</span>
            <span class="detail-value">${emp.certificates.length}</span>
          </div>
        </div>
        <div class="alert-box">⚠ Action Required: Complete ${(emp.requiredHours - emp.completedHours).toFixed(1)} more hours</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${dueSoonEmp.length > 0 ? `
  <div class="section">
    <div class="section-title">⏰ Due Soon - Next 30 Days (${dueSoonEmp.length})</div>
    ${dueSoonEmp.map(emp => `
      <div class="employee-card due-soon">
        <div class="employee-header">
          <div>
            <div class="employee-name">${emp.name}</div>
            <div class="employee-role">${emp.role}</div>
          </div>
          <span class="employee-status status-due-soon">DUE SOON</span>
        </div>
        <div class="employee-details">
          <div class="detail-row">
            <span class="detail-label">CEU Hours:</span>
            <span class="detail-value">${emp.completedHours}/${emp.requiredHours} (${Math.round((emp.completedHours / emp.requiredHours) * 100)}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Hours Needed:</span>
            <span class="detail-value">${(emp.requiredHours - emp.completedHours).toFixed(1)} hours</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Days Remaining:</span>
            <span class="detail-value">${emp.daysUntilDue} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Period End:</span>
            <span class="detail-value">${emp.currentPeriodEnd}</span>
          </div>
        </div>
        <div class="alert-box">⏰ Urgent: Complete requirements within ${emp.daysUntilDue} days</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${nonCompliantEmp.length > 0 ? `
  <div class="section">
    <div class="section-title">✗ Non-Compliant Staff (${nonCompliantEmp.length})</div>
    ${nonCompliantEmp.map(emp => `
      <div class="employee-card non-compliant">
        <div class="employee-header">
          <div>
            <div class="employee-name">${emp.name}</div>
            <div class="employee-role">${emp.role}</div>
          </div>
          <span class="employee-status status-non-compliant">NON-COMPLIANT</span>
        </div>
        <div class="employee-details">
          <div class="detail-row">
            <span class="detail-label">CEU Hours:</span>
            <span class="detail-value">${emp.completedHours}/${emp.requiredHours} (${Math.round((emp.completedHours / emp.requiredHours) * 100)}%)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Hours Needed:</span>
            <span class="detail-value">${(emp.requiredHours - emp.completedHours).toFixed(1)} hours</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Days Overdue:</span>
            <span class="detail-value">${Math.abs(emp.daysUntilDue)} days</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Period End:</span>
            <span class="detail-value">${emp.currentPeriodEnd}</span>
          </div>
        </div>
        ${emp.workRestrictions.length > 0 ? `<div class="alert-box">🔒 Restrictions Active: ${emp.workRestrictions.join(', ')}</div>` : ''}
        <div class="alert-box">✗ Critical: Requirements overdue - immediate action required</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">State Requirements</div>
    <table>
      <tr>
        <th>Role</th>
        <th>Required Hours</th>
        <th>Period</th>
        <th>Description</th>
      </tr>
      ${Object.entries(stateRequirements.michigan || {}).map(([role, req]: [string, any]) => `
        <tr>
          <td><strong>${role}</strong></td>
          <td>${req.hours} hours</td>
          <td>${req.period}</td>
          <td>${req.description}</td>
        </tr>
      `).join('')}
    </table>
  </div>

  ${(nonCompliantEmp.length > 0 || dueSoonEmp.length > 0 || atRiskEmp.length > 0 || (employees.length - completedOnboarding) > 0) ? `
  <div class="section">
    <div class="section-title">Recommendations</div>
    <div class="recommendations">
      <h4>Action Items</h4>
      <ul>
        ${nonCompliantEmp.length > 0 ? `<li><strong>Immediate Action Required:</strong> ${nonCompliantEmp.length} staff member(s) are non-compliant. Work restrictions are active. Schedule training immediately to restore compliance.</li>` : ''}
        ${dueSoonEmp.length > 0 ? `<li><strong>Upcoming Deadlines:</strong> ${dueSoonEmp.length} staff member(s) have requirements due within 30 days. Send reminders and schedule training sessions.</li>` : ''}
        ${atRiskEmp.length > 0 ? `<li><strong>Monitor At-Risk Staff:</strong> ${atRiskEmp.length} staff member(s) are at risk of non-compliance. Progress is below 60% with less than 90 days remaining. Proactive scheduling recommended.</li>` : ''}
        ${(employees.length - completedOnboarding) > 0 ? `<li><strong>Onboarding Completion:</strong> ${employees.length - completedOnboarding} staff member(s) have incomplete onboarding. Ensure all mandatory training modules are completed.</li>` : ''}
      </ul>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Report Summary</strong></p>
    <p>Overall Compliance: ${complianceRate}% | Staff Requiring Attention: ${complianceStats.atRisk + complianceStats.dueSoon + complianceStats.nonCompliant} | Work Restrictions Active: ${complianceStats.lockedOut}</p>
    <p style="margin-top: 20px; font-size: 11px;">
      This report provides a comprehensive overview of continuing education compliance for all staff members.<br>
      Regular monitoring and proactive scheduling are recommended to maintain compliance and avoid work restrictions.<br>
      For questions or concerns, please contact the Training Department.
    </p>
  </div>
</body>
</html>
                      `
                      
                      // Open in new window and trigger print dialog (which includes "Save as PDF")
                      const printWindow = window.open('', '_blank')
                      if (printWindow) {
                        printWindow.document.write(htmlContent)
                        printWindow.document.close()
                        
                        // Wait for content to load, then trigger print
                        printWindow.onload = () => {
                          setTimeout(() => {
                            printWindow.print()
                          }, 250)
                        }
                      }
                    }}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    <span>PDF Summary</span>
                    <span className="text-xs text-gray-500">Print/Save as PDF</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col bg-transparent hover:bg-purple-50"
                    onClick={() => {
                      const analyticsData = {
                        compliance: {
                          total: complianceStats.total,
                          compliant: complianceStats.compliant,
                          atRisk: complianceStats.atRisk,
                          dueSoon: complianceStats.dueSoon,
                          nonCompliant: complianceStats.nonCompliant,
                          rate: Math.round((complianceStats.compliant / complianceStats.total) * 100)
                        },
                        training: {
                          totalCertificates: employees.reduce((sum, emp) => sum + emp.certificates.length, 0),
                          averageHoursPerEmployee: (employees.reduce((sum, emp) => sum + emp.completedHours, 0) / employees.length).toFixed(1),
                          onboardingComplete: employees.filter(emp => emp.onboardingStatus.completed).length,
                          onboardingRate: Math.round((employees.filter(emp => emp.onboardingStatus.completed).length / employees.length) * 100)
                        },
                        byRole: Object.entries(
                          employees.reduce((acc, emp) => {
                            acc[emp.role] = (acc[emp.role] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                        ).map(([role, count]) => ({ role, count })),
                        byStatus: [
                          { status: 'Compliant', count: complianceStats.compliant, color: 'green' },
                          { status: 'At Risk', count: complianceStats.atRisk, color: 'yellow' },
                          { status: 'Due Soon', count: complianceStats.dueSoon, color: 'orange' },
                          { status: 'Non-Compliant', count: complianceStats.nonCompliant, color: 'red' }
                        ]
                      }
                      console.log("Analytics Dashboard Data:", analyticsData)
                      alert(`Analytics Dashboard Data:\n\nCompliance Rate: ${analyticsData.compliance.rate}%\nTotal Certificates: ${analyticsData.training.totalCertificates}\nAvg Hours: ${analyticsData.training.averageHoursPerEmployee}\n\nSee console for interactive data.`)
                    }}
                  >
                    <TrendingUp className="h-6 w-6 mb-2" />
                    <span>Analytics Dashboard</span>
                    <span className="text-xs text-gray-500">Interactive data (JSON)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Employee Detail Modal */}
        {selectedEmployee && (
          <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold">{selectedEmployee.name} - CEU Details</span>
                  <Badge className={getStatusColor(selectedEmployee.status)}>
                    {selectedEmployee.status.replace("_", " ").toUpperCase()}
                  </Badge>
                    </div>
                    <p className="text-sm text-gray-600 font-normal mt-1">
                  {selectedEmployee.role} • Hired {selectedEmployee.hireDate}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* CEU Progress */}
                <div>
                  <h4 className="font-semibold text-base mb-3">CEU Progress</h4>
                  <div className="grid grid-cols-3 gap-6 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Required Hours</p>
                      <p className="text-3xl font-bold">{selectedEmployee.requiredHours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Completed Hours</p>
                      <p className="text-3xl font-bold text-green-600">{selectedEmployee.completedHours}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Remaining Hours</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {Math.max(0, selectedEmployee.requiredHours - selectedEmployee.completedHours)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="font-medium">
                        {Math.round((selectedEmployee.completedHours / selectedEmployee.requiredHours) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full ${
                          selectedEmployee.status === "non_compliant"
                            ? "bg-red-500"
                            : selectedEmployee.status === "due_soon"
                            ? "bg-orange-500"
                            : selectedEmployee.status === "at_risk"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((selectedEmployee.completedHours / selectedEmployee.requiredHours) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Work Restrictions */}
                {selectedEmployee.workRestrictions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-red-700">Active Work Restrictions</h4>
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Lock className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-800">Employee is restricted from:</span>
                      </div>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {selectedEmployee.workRestrictions.map((restriction: string) => (
                          <li key={restriction}>
                            {restriction === "scheduling" && "New shift scheduling"}
                            {restriction === "payroll" && "Payroll processing"}
                            {restriction === "patient_assignments" && "New patient assignments"}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-red-600 mt-2">
                        Complete CEU requirements to lift restrictions automatically.
                      </p>
                    </div>
                  </div>
                )}

                {/* Certificates */}
                <div>
                  <h4 className="font-semibold text-base mb-3">Completed Training Certificates</h4>
                  {selectedEmployee.certificates && selectedEmployee.certificates.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.certificates.map((cert: any) => (
                        <div key={cert.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-semibold text-base mb-1">{cert.title}</h5>
                              <p className="text-sm text-gray-600 mb-2">{cert.provider}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Completed: {cert.completionDate}</span>
                                <span>•</span>
                                <span>CEU Hours: {cert.hoursEarned}</span>
                                {cert.certificateNumber && (
                                  <>
                                    <span>•</span>
                              <span>Cert #: {cert.certificateNumber}</span>
                                  </>
                                )}
                            </div>
                          </div>
                            <div className="flex items-center gap-2 ml-4">
                              {cert.status === "verified" ? (
                                <Badge className="bg-green-100 text-green-800 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                            </Badge>
                              ) : (
                                <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  In Progress
                                </Badge>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-1"
                                onClick={() => handleViewCertificate(cert)}
                              >
                                <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                      <Award className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No training certificates yet</p>
                      <p className="text-xs text-gray-400 mt-1">Complete trainings to earn certificates</p>
                    </div>
                  )}
                </div>

                {/* Onboarding Status */}
                <div>
                  <h4 className="font-semibold text-base mb-3">Onboarding Status</h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">
                        {selectedEmployee.onboardingStatus.completedModules} of{" "}
                        {selectedEmployee.onboardingStatus.totalModules} modules completed
                      </span>
                      {(() => {
                        const progressPercent = selectedEmployee.onboardingStatus.totalModules > 0
                          ? (selectedEmployee.onboardingStatus.completedModules / selectedEmployee.onboardingStatus.totalModules) * 100
                          : 0
                        
                        if (progressPercent === 100) {
                          return (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Complete
                        </Badge>
                          )
                        } else if (progressPercent > 0) {
                          return (
                            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                              In Progress ({Math.round(progressPercent)}%)
                        </Badge>
                          )
                        } else {
                          return (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                              <Clock className="h-3 w-3 mr-1" />
                              Not Started
                            </Badge>
                          )
                        }
                      })()}
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          (() => {
                            const progressPercent = selectedEmployee.onboardingStatus.totalModules > 0
                              ? (selectedEmployee.onboardingStatus.completedModules / selectedEmployee.onboardingStatus.totalModules) * 100
                              : 0
                            
                            if (progressPercent === 100) return "bg-green-500"
                            else if (progressPercent >= 75) return "bg-green-400"
                            else if (progressPercent >= 50) return "bg-yellow-500"
                            else if (progressPercent >= 25) return "bg-orange-500"
                            else if (progressPercent > 0) return "bg-red-400"
                            else return "bg-gray-400"
                          })()
                        }`}
                        style={{
                          width: `${
                            selectedEmployee.onboardingStatus.totalModules > 0
                              ? (selectedEmployee.onboardingStatus.completedModules /
                          selectedEmployee.onboardingStatus.totalModules) *
                        100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    
                    {/* List of Onboarding Trainings with Modules */}
                    {selectedEmployee.onboardingStatus.modules && selectedEmployee.onboardingStatus.modules.length > 0 && (
                      <div className="mt-3 space-y-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Mandatory Training Modules:</p>
                        {selectedEmployee.onboardingStatus.modules.map((training: any) => (
                          <div key={training.id} className="border rounded-lg p-3 bg-white">
                            {/* Training Header */}
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                {training.completed ? (
                                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                                )}
                                <div>
                                  <span className={`font-semibold text-sm ${training.completed ? "text-green-700" : "text-gray-700"}`}>
                                    {training.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <span>{training.category}</span>
                                    {training.totalModules > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{training.completedModules || 0}/{training.totalModules} modules</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {training.completed && training.completionDate && (
                                <span className="text-gray-500 text-xs ml-2">
                                  {training.completionDate}
                                </span>
                              )}
                            </div>
                            
                            {/* Sub-modules if available */}
                            {training.modules && training.modules.length > 0 && (
                              <div className="ml-7 mt-2 space-y-1">
                                {training.modules.map((submodule: any, idx: number) => (
                                  <div key={submodule.id || idx} className="flex items-center gap-2 text-xs">
                                    {submodule.completed ? (
                                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                    ) : (
                                      <div className="h-3 w-3 border border-gray-300 rounded-full flex-shrink-0" />
                                    )}
                                    <span className={submodule.completed ? "text-green-600" : "text-gray-500"}>
                                      {submodule.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedEmployee.onboardingStatus.completionDate && (
                      <p className="text-xs text-gray-600 mt-3">
                        All modules completed on {selectedEmployee.onboardingStatus.completionDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedEmployee(null)
                      setUploadDialogOpen(true)
                    }}
                  >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Certificate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4 mr-2" />
                      Send Reminder
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export Record
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Print Summary
                    </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      {/* Certificate Viewer Modal */}
      {viewingCertificate && (
        <CertificateModal
          open={!!viewingCertificate}
          onOpenChange={(open) => !open && setViewingCertificate(null)}
          staffName={viewingCertificate.staffName}
          trainingTitle={viewingCertificate.trainingTitle}
          completionDate={viewingCertificate.completionDate}
          ceuHours={viewingCertificate.ceuHours}
          score={viewingCertificate.score}
          certificateId={viewingCertificate.certificateId}
          staffId={viewingCertificate.staffId}
        />
      )}

      {/* Edit Module Modal - Same as in-service */}
      <Dialog open={editModuleDialogOpen} onOpenChange={(open) => {
        setEditModuleDialogOpen(open)
        if (!open) {
          setEditingModule(null)
          setTrainingError(null)
          setTrainingModules([])
          setTrainingForm({
            title: "",
            category: "",
            description: "",
            duration: "",
            ceuHours: "",
            difficulty: "",
            targetRoles: [],
            mandatory: "false",
            type: "online_course",
          })
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Onboarding Module" : "Create New Module"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Update module details and requirements" : "Design a new onboarding module"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveModuleEdit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Training Title *</Label>
                <Input 
                  id="title" 
                  value={trainingForm.title}
                  onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })}
                  placeholder="Enter training title" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={trainingForm.category} 
                  onValueChange={(value) => setTrainingForm({ ...trainingForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Clinical Skills">Clinical Skills</SelectItem>
                    <SelectItem value="Patient Safety">Patient Safety</SelectItem>
                    <SelectItem value="Safety & Compliance">Safety & Compliance</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Professional Development">Professional Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea 
                id="description" 
                value={trainingForm.description}
                onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                placeholder="Describe the training content and objectives" 
                required 
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  value={trainingForm.duration}
                  onChange={(e) => setTrainingForm({ ...trainingForm, duration: e.target.value })}
                  placeholder="90" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="ceu-hours">CEU Hours</Label>
                <Input 
                  id="ceu-hours" 
                  type="number" 
                  step="0.25" 
                  value={trainingForm.ceuHours}
                  onChange={(e) => setTrainingForm({ ...trainingForm, ceuHours: e.target.value })}
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select 
                  value={trainingForm.difficulty} 
                  onValueChange={(value) => setTrainingForm({ ...trainingForm, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-roles">Target Roles *</Label>
                <div className="mt-2 space-y-2 border rounded-md p-3 max-h-48 overflow-y-auto">
                  {[
                    { value: "all", label: "All Roles" },
                    { value: "RN", label: "RN" },
                    { value: "LPN", label: "LPN" },
                    { value: "CNA", label: "CNA" },
                    { value: "PT", label: "PT" },
                    { value: "PTA", label: "PTA" },
                    { value: "OT", label: "OT" },
                  ].map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`target-role-${role.value}`}
                        checked={trainingForm.targetRoles.includes(role.value)}
                        onChange={(e) => {
                          if (role.value === "all") {
                            if (e.target.checked) {
                              setTrainingForm({ ...trainingForm, targetRoles: ["all"] })
                            } else {
                              setTrainingForm({ ...trainingForm, targetRoles: [] })
                            }
                          } else {
                            if (e.target.checked) {
                              const newRoles = trainingForm.targetRoles.filter(r => r !== "all")
                              setTrainingForm({ ...trainingForm, targetRoles: [...newRoles, role.value] })
                            } else {
                              setTrainingForm({ ...trainingForm, targetRoles: trainingForm.targetRoles.filter(r => r !== role.value) })
                            }
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`target-role-${role.value}`} className="text-sm font-normal cursor-pointer">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {trainingForm.targetRoles.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {trainingForm.targetRoles.join(", ")}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="mandatory">Mandatory</Label>
                <Select 
                  value={trainingForm.mandatory} 
                  onValueChange={(value) => setTrainingForm({ ...trainingForm, mandatory: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Is mandatory?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Optional</SelectItem>
                    <SelectItem value="true">Mandatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Training Modules Section - Same as in-service */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Training Modules</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newModule = {
                      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      title: "",
                      duration: 0,
                      file: null as File | null,
                      fileName: "",
                    }
                    setTrainingModules([...trainingModules, newModule])
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
              
              {trainingModules.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm border rounded-md">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No modules added. Click "Add Module" to add training content.</p>
                </div>
              ) : (
                <div className="space-y-3 border rounded-md p-4">
                  {trainingModules.map((module, index) => (
                    <div key={module.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm">Module {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTrainingModules(trainingModules.filter((m) => m.id !== module.id))
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor={`module-title-${module.id}`} className="text-sm">Module Title *</Label>
                          <Input
                            id={`module-title-${module.id}`}
                            value={module.title}
                            onChange={(e) => {
                              const updated = trainingModules.map((m) =>
                                m.id === module.id ? { ...m, title: e.target.value } : m
                              )
                              setTrainingModules(updated)
                            }}
                            placeholder="e.g., Introduction to Safety Protocols"
                            className="mt-1"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`module-duration-${module.id}`} className="text-sm">Duration (minutes) *</Label>
                            <Input
                              id={`module-duration-${module.id}`}
                              type="number"
                              value={module.duration || ""}
                              onChange={(e) => {
                                const updated = trainingModules.map((m) =>
                                  m.id === module.id ? { ...m, duration: parseInt(e.target.value) || 0 } : m
                                )
                                setTrainingModules(updated)
                              }}
                              placeholder="30"
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`module-file-${module.id}`} className="text-sm">
                              Upload Document {!module.fileUrl ? "*" : ""}
                            </Label>
                            <div className="mt-1">
                              {module.fileUrl && !module.file && (
                                <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                                  <p className="text-green-700 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Existing file: {module.fileName || "File"}
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2 text-xs"
                                    onClick={() => {
                                      if (module.fileUrl) {
                                        window.open(module.fileUrl, '_blank', 'noopener,noreferrer')
                                      }
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View Current File
                                  </Button>
                                </div>
                              )}
                              <input
                                id={`module-file-${module.id}`}
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const updated = trainingModules.map((m) =>
                                      m.id === module.id
                                        ? { ...m, file: file, fileName: file.name, fileUrl: undefined }
                                        : m
                                    )
                                    setTrainingModules(updated)
                                  }
                                }}
                                className="hidden"
                              />
                              <label htmlFor={`module-file-${module.id}`}>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    const fileInput = document.getElementById(`module-file-${module.id}`) as HTMLInputElement
                                    if (fileInput) {
                                      fileInput.click()
                                    }
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  {module.file 
                                    ? `New: ${module.fileName}` 
                                    : module.fileUrl 
                                      ? "Replace File (PDF, DOC, PPT, etc.)" 
                                      : "Choose File (PDF, DOC, PPT, etc.)"}
                                </Button>
                              </label>
                              {module.fileName && module.file && (
                                <p className="text-xs text-gray-500 mt-1">
                                  ✓ New file: {module.fileName} ({((module.file.size / 1024 / 1024).toFixed(2))} MB)
                                </p>
                              )}
                              {module.fileUrl && !module.file && (
                                <p className="text-xs text-green-600 mt-1">
                                  ℹ️ Current file will be kept. Upload a new file to replace it.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {trainingError && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm">
                {trainingError}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditModuleDialogOpen(false)
                  setTrainingError(null)
                  setTrainingModules([])
                  setTrainingForm({
                    title: "",
                    category: "",
                    description: "",
                    duration: "",
                    ceuHours: "",
                    difficulty: "",
                    targetRoles: [],
                    mandatory: "false",
                    type: "online_course",
                  })
                }}
                disabled={isSubmittingTraining}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmittingTraining || !trainingForm.title || !trainingForm.category || !trainingForm.description || !trainingForm.duration || !trainingForm.targetRoles || trainingForm.targetRoles.length === 0}
              >
                {isSubmittingTraining 
                  ? (editingModule ? "Updating..." : "Creating...") 
                  : (editingModule ? "Update Training" : "Create Training")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Module Modal */}
      <Dialog open={previewModuleDialogOpen} onOpenChange={setPreviewModuleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{previewingModule?.title}</span>
              {previewingModule?.required && (
                <Badge className="bg-red-100 text-red-800">Required</Badge>
              )}
            </DialogTitle>
            <DialogDescription>Preview of the onboarding module details</DialogDescription>
          </DialogHeader>
          {previewingModule && (
            <div className="space-y-6">
              {/* Module Info */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Module Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{previewingModule.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Time:</span>
                    <p className="font-medium">{previewingModule.estimatedTime} minutes</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Due Within:</span>
                    <p className="font-medium">{previewingModule.dueWithin} days of hire</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">
                      {previewingModule.required ? "Mandatory" : "Optional"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {previewingModule.description || "No description available"}
                </p>
              </div>

              {/* Target Roles */}
              {previewingModule.roles && previewingModule.roles.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Target Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewingModule.roles.map((role: string) => (
                      <Badge key={role} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Stats */}
              <div>
                <h4 className="font-semibold mb-2">Completion Statistics</h4>
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <div className="h-2 w-2 rounded-full bg-green-600 mr-1 animate-pulse" />
                      Based on Enrollment Table
                    </Badge>
                  </div>
                  {(() => {
                    // Determine eligible employees based on target roles
                    const hasTargetRoles = previewingModule.roles && previewingModule.roles.length > 0
                    const includesAllRoles = hasTargetRoles && (
                      previewingModule.roles.includes("all") || 
                      previewingModule.roles.includes("All")
                    )
                    
                    // All employees are eligible if:
                    // 1. No target roles specified
                    // 2. "all" or "All" is in the target roles list
                    const eligibleEmployees = !hasTargetRoles || includesAllRoles
                      ? employees
                      : employees.filter(emp => {
                          // Check if employee's role matches any target role
                          const employeeRole = (emp.role || "").toUpperCase().trim()
                          return previewingModule.roles.some((role: string) => {
                            const roleUpper = (role || "").toUpperCase().trim()
                            // Exact match or contains role
                            return employeeRole === roleUpper || 
                                   employeeRole.includes(roleUpper) ||
                                   (roleUpper.includes(employeeRole) && employeeRole.length >= 2)
                          })
                        })
                    
                    // Get all enrollments for this specific training from the enrollment table
                    const trainingEnrollments = enrollments.filter((enr: any) => 
                      enr.training_id === previewingModule.id
                    )
                    
                    // Get employee IDs who have enrollments for this training
                    const enrolledEmployeeIds = new Set(trainingEnrollments.map((e: any) => e.employee_id))
                    
                    // Filter to only eligible employees who are enrolled
                    const eligibleEnrolledEmployees = eligibleEmployees.filter(emp => 
                      enrolledEmployeeIds.has(emp.id)
                    )
                    
                    // Count COMPLETED STAFF: mga staff na naka-complete na sa training (status = 'completed')
                    const completedStaff = eligibleEmployees.filter(emp => {
                      // Find enrollment record for this employee and training
                      const enrollment = trainingEnrollments.find((enr: any) => 
                        enr.employee_id === emp.id
                      )
                      // Staff is completed if enrollment status = 'completed'
                      return enrollment && enrollment.status === "completed"
                    })
                    const completedCount = completedStaff.length
                    
                    // Count IN PROGRESS STAFF: mga staff na naa pa sa in_progress (status = 'in_progress')
                    const inProgressStaff = eligibleEmployees.filter(emp => {
                      // Find enrollment record for this employee and training
                      const enrollment = trainingEnrollments.find((enr: any) => 
                        enr.employee_id === emp.id
                      )
                      if (!enrollment || enrollment.status !== "in_progress") return false
                      
                      // In progress = status is 'in_progress' (with or without completed modules)
                      return true
                    })
                    const inProgressCount = inProgressStaff.length
                    
                    // Count NOT STARTED STAFF: mga staff na nag-enroll na pero wala pa nag-start (status = 'enrolled')
                    const notStartedStaff = eligibleEmployees.filter(emp => {
                      // Find enrollment record for this employee and training
                      const enrollment = trainingEnrollments.find((enr: any) => 
                        enr.employee_id === emp.id
                      )
                      // Not started if enrollment status = 'enrolled'
                      return enrollment && enrollment.status === "enrolled"
                    })
                    const notStartedEnrolledCount = notStartedStaff.length
                    
                    // Count NOT ASSIGNED: eligible employees without enrollment record
                    const notAssignedEmployees = eligibleEmployees.filter(emp => 
                      !enrolledEmployeeIds.has(emp.id)
                    )
                    const notAssignedCount = notAssignedEmployees.length
                    
                    // Total not started = enrolled but not started + not assigned
                    const notStartedCount = notStartedEnrolledCount + notAssignedCount
                    
                    // Total assigned = completed + in progress + enrolled but not started
                    const assignedEmployeesCount = completedCount + inProgressCount + notStartedEnrolledCount
                    
                    // Calculate completion rate based on employees who have this training assigned
                    const completionRate = assignedEmployeesCount > 0
                      ? Math.round((completedCount / assignedEmployeesCount) * 100)
                      : 0
                    
                    return (
                      <>
                        <div className="grid grid-cols-4 gap-4 text-center mb-4">
                          <div>
                            <p className="text-2xl font-bold text-green-600">
                              {completedCount}
                            </p>
                            <p className="text-xs text-gray-600">Completed</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">staff naka-complete</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-orange-600">
                              {inProgressCount}
                            </p>
                            <p className="text-xs text-gray-600">In Progress</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">staff naa pa gi-train</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-600">
                              {notStartedCount}
                            </p>
                            <p className="text-xs text-gray-600">Not Started</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">staff wala pa start</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {completionRate}%
                            </p>
                            <p className="text-xs text-gray-600">Completion Rate</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">% sa nag-enroll</p>
                          </div>
                        </div>
                        
                        {/* Breakdown Details */}
                        <div className="border-t pt-3 text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Total Eligible Staff:</span>
                            <span className="font-semibold">{eligibleEmployees.length} staff</span>
                          </div>
                          <div className="flex justify-between">
                            <span>• Enrolled sa Training:</span>
                            <span className="font-semibold">{eligibleEnrolledEmployees.length} staff</span>
                          </div>
                          <div className="flex justify-between ml-4 text-gray-500">
                            <span>- Naka-complete (status='completed'):</span>
                            <span className="font-semibold text-green-600">{completedCount} staff</span>
                          </div>
                          <div className="flex justify-between ml-4 text-gray-500">
                            <span>- In progress (status='in_progress'):</span>
                            <span className="font-semibold text-orange-600">{inProgressCount} staff</span>
                          </div>
                          <div className="flex justify-between ml-4 text-gray-500">
                            <span>- Wala pa start (status='enrolled'):</span>
                            <span className="font-semibold text-gray-600">{notStartedEnrolledCount} staff</span>
                          </div>
                          {notAssignedCount > 0 && (
                            <div className="flex justify-between text-orange-600">
                              <span>• Wala pa gi-enroll:</span>
                              <span className="font-semibold">{notAssignedCount} staff</span>
                            </div>
                          )}
                          {assignedEmployeesCount > 0 && (
                            <div className="flex justify-between mt-2 pt-2 border-t font-semibold">
                              <span>Completion Rate (enrolled staff):</span>
                              <span className="text-blue-600">
                                {completedCount}/{assignedEmployeesCount} staff ({completionRate}%)
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10px] text-gray-400 mt-2 pt-2 border-t">
                            <span>📊 Data Source:</span>
                            <span>in_service_enrollments table</span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewModuleDialogOpen(false)
                    handleEditModule(previewingModule)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Module
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPreviewModuleDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
