"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Crown,
  Home,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  HeartHandshake,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Clock,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CareTeamMember {
  id: string
  patientId: string
  staffId: string
  role: string
  specialty?: string
  isPrimary: boolean
  isAssignedStaff: boolean
  addedDate: string
  notes?: string
  staff: {
    id: string
    name: string
    email: string
    phone?: string
    credentials?: string
    department?: string
    specialties?: string[]
  }
}

interface Patient {
  id: string
  name: string
  patientId?: string
  currentStatus: string
}

interface Staff {
  id: string
  name: string
  email: string
  phone_number?: string
  credentials?: string
  department?: string
  specialties?: string[]
}

export default function CareTeamManagementPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [careTeam, setCareTeam] = useState<CareTeamMember[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CareTeamMember | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    staffId: "",
    specialty: "",
    isPrimary: false,
    isAssignedStaff: false,
    notes: "",
  })
  
  // Get selected staff details for role
  const selectedStaff = staffList.find(s => s.id === formData.staffId)
  const staffRole = selectedStaff 
    ? (selectedStaff.credentials || selectedStaff.department || "Healthcare Provider")
    : ""

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/patients")
        const data = await response.json()
        if (data.patients) {
          setPatients(data.patients)
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
        toast({
          title: "Error",
          description: "Failed to load patients",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchPatients()
  }, [toast])

  // Fetch staff list
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff/list")
        const data = await response.json()
        if (data.success && data.staff) {
          setStaffList(data.staff)
        }
      } catch (error) {
        console.error("Error fetching staff:", error)
      }
    }
    fetchStaff()
  }, [])

  // Fetch care team when patient is selected
  useEffect(() => {
    if (selectedPatient?.id) {
      fetchCareTeam(selectedPatient.id)
    } else {
      setCareTeam([])
    }
  }, [selectedPatient])

  const fetchCareTeam = async (patientId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${patientId}/care-team`)
      const data = await response.json()
      if (data.success) {
        setCareTeam(data.careTeam || [])
      }
    } catch (error) {
      console.error("Error fetching care team:", error)
      toast({
        title: "Error",
        description: "Failed to load care team",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedPatient?.id || !formData.staffId) {
      toast({
        title: "Validation Error",
        description: "Please select a staff member",
        variant: "destructive",
      })
      return
    }

    // Get role from selected staff
    const selectedStaff = staffList.find(s => s.id === formData.staffId)
    const role = selectedStaff 
      ? (selectedStaff.credentials || selectedStaff.department || "Healthcare Provider")
      : "Healthcare Provider"

    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/care-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: role,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Care team member added successfully",
        })
        setIsAddDialogOpen(false)
        setFormData({
          staffId: "",
          specialty: "",
          isPrimary: false,
          isAssignedStaff: false,
          notes: "",
        })
        fetchCareTeam(selectedPatient.id)
      } else {
        throw new Error(data.error || "Failed to add member")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add care team member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMember = async () => {
    if (!selectedPatient?.id || !selectedMember?.id) return

    // Get role from selected staff (use existing role if staff not changed)
    const selectedStaff = staffList.find(s => s.id === formData.staffId)
    const role = selectedStaff 
      ? (selectedStaff.credentials || selectedStaff.department || selectedMember.role)
      : selectedMember.role

    setIsLoading(true)
    try {
      const response = await fetch(`/api/patients/${selectedPatient.id}/care-team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careTeamId: selectedMember.id,
          ...formData,
          role: role,
        }),
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Care team member updated successfully",
        })
        setIsEditDialogOpen(false)
        setSelectedMember(null)
        fetchCareTeam(selectedPatient.id)
      } else {
        throw new Error(data.error || "Failed to update member")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update care team member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!selectedPatient?.id) return

    if (!confirm("Are you sure you want to remove this care team member?")) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/patients/${selectedPatient.id}/care-team?careTeamId=${memberId}`,
        {
          method: "DELETE",
        }
      )

      const data = await response.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Care team member removed successfully",
        })
        fetchCareTeam(selectedPatient.id)
      } else {
        throw new Error(data.error || "Failed to remove member")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove care team member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (member: CareTeamMember) => {
    setSelectedMember(member)
    setFormData({
      staffId: member.staffId,
      specialty: member.specialty || "",
      isPrimary: member.isPrimary,
      isAssignedStaff: member.isAssignedStaff,
      notes: member.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || patient.currentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes("physician") || role.toLowerCase().includes("doctor")) {
      return <Stethoscope className="h-4 w-4" />
    }
    if (role.toLowerCase().includes("nurse")) {
      return <HeartHandshake className="h-4 w-4" />
    }
    if (role.toLowerCase().includes("therapist")) {
      return <GraduationCap className="h-4 w-4" />
    }
    if (role.toLowerCase().includes("social")) {
      return <Briefcase className="h-4 w-4" />
    }
    return <Users className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <HeartHandshake className="h-6 w-6 text-white" />
            </div>
            Care Team Management
          </h1>
          <p className="text-gray-600 mt-1">Manage care teams for patients</p>
        </div>
        {selectedPatient && (
          <Button
            onClick={() => {
              setIsAddDialogOpen(true)
              setFormData({
                staffId: "",
                specialty: "",
                isPrimary: false,
                isAssignedStaff: false,
                notes: "",
              })
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Selection */}
        <Card className="lg:col-span-1 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="search">Search Patients</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPatient?.id === patient.id
                      ? "border-2 border-indigo-500 bg-indigo-50"
                      : "border"
                  }`}
                  onClick={() => setSelectedPatient(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{patient.name}</p>
                        {patient.patientId && (
                          <p className="text-sm text-gray-500">{patient.patientId}</p>
                        )}
                        <Badge
                          variant={
                            patient.currentStatus === "Active"
                              ? "default"
                              : patient.currentStatus === "Pending"
                                ? "secondary"
                                : "outline"
                          }
                          className="mt-1"
                        >
                          {patient.currentStatus}
                        </Badge>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Care Team Display */}
        <Card className="lg:col-span-2 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Care Team
                {selectedPatient && (
                  <Badge variant="outline" className="ml-2">
                    {careTeam.length} {careTeam.length === 1 ? "member" : "members"}
                  </Badge>
                )}
              </div>
              {selectedPatient && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedPatient && fetchCareTeam(selectedPatient.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              {selectedPatient
                ? `Care team for ${selectedPatient.name}`
                : "Select a patient to view their care team"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {!selectedPatient ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg">Select a patient to view their care team</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-indigo-600" />
                <p className="text-gray-600">Loading care team...</p>
              </div>
            ) : careTeam.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg mb-2">No care team members assigned</p>
                <p className="text-gray-500 text-sm mb-4">
                  Add team members to provide comprehensive care
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {careTeam.map((member) => (
                  <Card
                    key={member.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <Avatar className="h-16 w-16 ring-4 ring-indigo-100">
                            <AvatarImage src={`/placeholder.svg`} />
                            <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-lg">
                              {member.staff.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">
                                {member.staff.name}
                              </h3>
                              {member.isPrimary && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Primary
                                </Badge>
                              )}
                              {member.isAssignedStaff && (
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                  <Home className="h-3 w-3 mr-1" />
                                  Assigned Staff
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              {getRoleIcon(member.role)}
                              <span className="font-medium">{member.role}</span>
                              {member.specialty && (
                                <>
                                  <span>•</span>
                                  <span>{member.specialty}</span>
                                </>
                              )}
                            </div>
                            {member.staff.credentials && (
                              <Badge variant="outline" className="mb-2">
                                {member.staff.credentials}
                              </Badge>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                              {member.staff.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{member.staff.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{member.staff.email}</span>
                              </div>
                              {member.staff.department && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{member.staff.department}</span>
                                </div>
                              )}
                            </div>
                            {member.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                <p className="text-sm text-gray-700">{member.notes}</p>
                              </div>
                            )}
                            <div className="mt-2 text-xs text-gray-500">
                              Added: {new Date(member.addedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Care Team Member
            </DialogTitle>
            <DialogDescription>
              Add a staff member to {selectedPatient?.name}'s care team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="staff-select">Staff Member *</Label>
              <Select
                value={formData.staffId}
                onValueChange={(value) => setFormData({ ...formData, staffId: value })}
              >
                <SelectTrigger id="staff-select" className="mt-1">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} {staff.credentials && `(${staff.credentials})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStaff && (
              <div>
                <Label>Role</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedStaff.credentials || selectedStaff.department || "Healthcare Provider"}
                  </p>
                  {selectedStaff.department && selectedStaff.credentials && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedStaff.department} • {selectedStaff.credentials}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="specialty">Specialty</Label>
              <Input
                id="specialty"
                placeholder="e.g., Internal Medicine, Home Health"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-primary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-primary" className="cursor-pointer">
                  Primary Provider
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-assigned"
                  checked={formData.isAssignedStaff}
                  onChange={(e) =>
                    setFormData({ ...formData, isAssignedStaff: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is-assigned" className="cursor-pointer">
                  Assigned Staff (Home Visits)
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this care team member..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={isLoading || !formData.staffId}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Care Team Member
            </DialogTitle>
            <DialogDescription>
              Update care team member information for {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Staff Member</Label>
              <Input
                value={
                  staffList.find((s) => s.id === formData.staffId)?.name || "Loading..."
                }
                disabled
                className="mt-1 bg-gray-50"
              />
            </div>

            {selectedMember && (
              <div>
                <Label>Role</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMember.role}
                  </p>
                  {selectedMember.staff?.department && selectedMember.staff?.credentials && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedMember.staff.department} • {selectedMember.staff.credentials}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-specialty">Specialty</Label>
              <Input
                id="edit-specialty"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-primary"
                  checked={formData.isPrimary}
                  onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-is-primary" className="cursor-pointer">
                  Primary Provider
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-is-assigned"
                  checked={formData.isAssignedStaff}
                  onChange={(e) =>
                    setFormData({ ...formData, isAssignedStaff: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-is-assigned" className="cursor-pointer">
                  Assigned Staff (Home Visits)
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditMember}
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Update Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

