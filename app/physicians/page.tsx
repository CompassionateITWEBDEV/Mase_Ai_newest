"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  UserCheck,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Download,
  Eye,
  Calendar,
  Stethoscope,
  AlertCircle,
} from "lucide-react"

interface Physician {
  id: string
  npi: string
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
  licenseState: string
  licenseExpiration: string
  caqhId?: string
  verificationStatus: "verified" | "pending" | "expired" | "error" | "not_verified"
  lastVerified: string
  boardCertification?: string
  boardExpiration?: string
  malpracticeInsurance: boolean
  malpracticeExpiration?: string
  deaNumber?: string
  deaExpiration?: string
  hospitalAffiliations: string[]
  addedDate: string
  addedBy: string
  notes?: string
}

interface VerificationResult {
  success: boolean
  verificationId: string
  status: string
  details: {
    medicalLicense: string
    boardCertification: string
    malpracticeInsurance: string
    deaRegistration?: string
  }
  expirationDates: {
    license: string
    board?: string
    malpractice?: string
    dea?: string
  }
  lastUpdated: string
}

export default function PhysiciansPage() {
  const [physicians, setPhysicians] = useState<Physician[]>([])
  const [isAddPhysicianOpen, setIsAddPhysicianOpen] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null)
  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isVerifying, setIsVerifying] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [newPhysician, setNewPhysician] = useState({
    npi: "",
    firstName: "",
    lastName: "",
    specialty: "",
    licenseNumber: "",
    licenseState: "MI",
    licenseExpiration: "",
    boardCertification: "",
    boardExpiration: "",
    deaNumber: "",
    deaExpiration: "",
    hospitalAffiliations: "",
    notes: "",
  })

  // Fetch physicians from API
  const fetchPhysicians = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch("/api/physicians")
      if (!response.ok) throw new Error("Failed to fetch physicians")
      
      const data = await response.json()
      
      // Transform snake_case to camelCase for frontend
      const transformedPhysicians = data.physicians.map((p: any) => ({
        id: p.id,
        npi: p.npi,
        firstName: p.first_name,
        lastName: p.last_name,
        specialty: p.specialty || "",
        licenseNumber: p.license_number || "",
        licenseState: p.license_state || "",
        licenseExpiration: p.license_expiration || "",
        caqhId: p.caqh_id,
        verificationStatus: p.verification_status,
        lastVerified: p.last_verified || "Never",
        boardCertification: p.board_certification,
        boardExpiration: p.board_expiration,
        malpracticeInsurance: p.malpractice_insurance,
        malpracticeExpiration: p.malpractice_expiration,
        deaNumber: p.dea_number,
        deaExpiration: p.dea_expiration,
        hospitalAffiliations: p.hospital_affiliations || [],
        addedDate: new Date(p.created_at).toISOString().split("T")[0],
        addedBy: p.added_by || "Unknown",
        notes: p.notes,
      }))
      
      setPhysicians(transformedPhysicians)
    } catch (err) {
      console.error("Error fetching physicians:", err)
      setError("Failed to load physicians")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhysicians()
  }, [])

  const filteredPhysicians = physicians.filter((physician) => {
    const matchesSearch =
      physician.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.npi.includes(searchTerm) ||
      physician.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      physician.specialty.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || physician.verificationStatus === filterStatus

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "expired":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      case "error":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case "not_verified":
        return (
          <Badge variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            Not Verified
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getExpirationStatus = (expirationDate: string) => {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiration = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24))

    if (daysUntilExpiration < 0) {
      return { status: "expired", days: Math.abs(daysUntilExpiration), color: "text-red-600" }
    } else if (daysUntilExpiration <= 30) {
      return { status: "expiring", days: daysUntilExpiration, color: "text-orange-600" }
    } else if (daysUntilExpiration <= 90) {
      return { status: "warning", days: daysUntilExpiration, color: "text-yellow-600" }
    } else {
      return { status: "valid", days: daysUntilExpiration, color: "text-green-600" }
    }
  }

  const verifyPhysician = async (physicianId: string) => {
    setIsVerifying((prev) => new Set(prev).add(physicianId))

    try {
      const physician = physicians.find((p) => p.id === physicianId)
      if (!physician) return

      // Step 1: Set status to "pending" before verification starts
      const pendingUpdate = await fetch(`/api/physicians/${physicianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "pending",
        }),
      })

      if (pendingUpdate.ok) {
        // Update local state to show pending immediately
        setPhysicians((prev) =>
          prev.map((p) =>
            p.id === physicianId
              ? { ...p, verificationStatus: "pending" as const }
              : p,
          ),
        )
      }

      // Step 2: Call CAQH verification API
      const response = await fetch("/api/caqh/verify-physician", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          physicianId,
          npi: physician.npi,
          licenseNumber: physician.licenseNumber,
          licenseState: physician.licenseState,
        }),
      })

      if (!response.ok) throw new Error("Verification failed")

      const result = await response.json()

      // Step 3: Update physician with verification results
      const updateResponse = await fetch(`/api/physicians/${physicianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: result.status || "error", // Use actual status from API
          lastVerified: new Date().toISOString().split("T")[0],
          caqhId: result.caqhId,
        }),
      })

      if (updateResponse.ok) {
        // Update local state with final verification status
        setPhysicians((prev) =>
          prev.map((p) =>
            p.id === physicianId
              ? {
                  ...p,
                  verificationStatus: (result.status || "error") as any,
                  lastVerified: new Date().toISOString().split("T")[0],
                  caqhId: result.caqhId,
                }
              : p,
          ),
        )
      }

      setVerificationResults(result)
      setSelectedPhysician(physicians.find((p) => p.id === physicianId) || null)
      setIsVerificationOpen(true)
    } catch (error) {
      console.error("Verification error:", error)
      setError("Failed to verify physician")
      
      // Set to error status if verification fails
      const errorUpdate = await fetch(`/api/physicians/${physicianId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: "error",
        }),
      })
      
      if (errorUpdate.ok) {
        setPhysicians((prev) =>
          prev.map((p) =>
            p.id === physicianId
              ? { ...p, verificationStatus: "error" as const }
              : p,
          ),
        )
      }
    } finally {
      setIsVerifying((prev) => {
        const newSet = new Set(prev)
        newSet.delete(physicianId)
        return newSet
      })
    }
  }

  const addPhysician = async () => {
    try {
      const physicianData = {
        npi: newPhysician.npi,
        firstName: newPhysician.firstName,
        lastName: newPhysician.lastName,
        specialty: newPhysician.specialty,
        licenseNumber: newPhysician.licenseNumber,
        licenseState: newPhysician.licenseState,
        licenseExpiration: newPhysician.licenseExpiration || null,
        boardCertification: newPhysician.boardCertification,
        boardExpiration: newPhysician.boardExpiration || null,
        malpracticeInsurance: true,
        deaNumber: newPhysician.deaNumber,
        deaExpiration: newPhysician.deaExpiration || null,
        hospitalAffiliations: newPhysician.hospitalAffiliations
          ? newPhysician.hospitalAffiliations.split(",").map((s) => s.trim())
          : [],
        notes: newPhysician.notes,
        addedBy: "Current User",
      }

      const response = await fetch("/api/physicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(physicianData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add physician")
      }

      const result = await response.json()
      
      // Refresh the physician list
      await fetchPhysicians()

      setIsAddPhysicianOpen(false)

      // Reset form
      setNewPhysician({
        npi: "",
        firstName: "",
        lastName: "",
        specialty: "",
        licenseNumber: "",
        licenseState: "MI",
        licenseExpiration: "",
        boardCertification: "",
        boardExpiration: "",
        deaNumber: "",
        deaExpiration: "",
        hospitalAffiliations: "",
        notes: "",
      })

      // Automatically start verification after a short delay
      if (result.physician?.id) {
        setTimeout(() => verifyPhysician(result.physician.id), 1000)
      }
    } catch (err) {
      console.error("Error adding physician:", err)
      setError(err instanceof Error ? err.message : "Failed to add physician")
    }
  }

  const stats = {
    total: physicians.length,
    verified: physicians.filter((p) => p.verificationStatus === "verified").length,
    pending: physicians.filter((p) => p.verificationStatus === "pending").length,
    expired: physicians.filter((p) => p.verificationStatus === "expired").length,
    expiringLicenses: physicians.filter((p) => {
      const expStatus = getExpirationStatus(p.licenseExpiration)
      return expStatus.status === "expiring" || expStatus.status === "expired"
    }).length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ordering Physicians</h1>
              <p className="text-gray-600">CAQH License Verification & Credential Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isAddPhysicianOpen} onOpenChange={setIsAddPhysicianOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Physician
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Ordering Physician</DialogTitle>
                    <DialogDescription>Enter physician details for automatic CAQH verification</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div>
                      <Label htmlFor="npi">NPI Number</Label>
                      <Input
                        id="npi"
                        value={newPhysician.npi}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, npi: e.target.value }))}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Specialty</Label>
                      <Input
                        id="specialty"
                        value={newPhysician.specialty}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, specialty: e.target.value }))}
                        placeholder="Internal Medicine"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newPhysician.firstName}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Dr. John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newPhysician.lastName}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenseNumber">License Number</Label>
                      <Input
                        id="licenseNumber"
                        value={newPhysician.licenseNumber}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, licenseNumber: e.target.value }))}
                        placeholder="MD123456"
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenseState">License State</Label>
                      <Select
                        value={newPhysician.licenseState}
                        onValueChange={(value) => setNewPhysician((prev) => ({ ...prev, licenseState: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MI">Michigan</SelectItem>
                          <SelectItem value="OH">Ohio</SelectItem>
                          <SelectItem value="IN">Indiana</SelectItem>
                          <SelectItem value="IL">Illinois</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="licenseExpiration">License Expiration</Label>
                      <Input
                        id="licenseExpiration"
                        type="date"
                        value={newPhysician.licenseExpiration}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, licenseExpiration: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="boardCertification">Board Certification</Label>
                      <Input
                        id="boardCertification"
                        value={newPhysician.boardCertification}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, boardCertification: e.target.value }))}
                        placeholder="Internal Medicine"
                      />
                    </div>
                    <div>
                      <Label htmlFor="boardExpiration">Board Expiration</Label>
                      <Input
                        id="boardExpiration"
                        type="date"
                        value={newPhysician.boardExpiration}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, boardExpiration: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="deaNumber">DEA Number</Label>
                      <Input
                        id="deaNumber"
                        value={newPhysician.deaNumber}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, deaNumber: e.target.value }))}
                        placeholder="BJ1234567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="deaExpiration">DEA Expiration</Label>
                      <Input
                        id="deaExpiration"
                        type="date"
                        value={newPhysician.deaExpiration}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, deaExpiration: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="hospitalAffiliations">Hospital Affiliations</Label>
                      <Input
                        id="hospitalAffiliations"
                        value={newPhysician.hospitalAffiliations}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, hospitalAffiliations: e.target.value }))}
                        placeholder="Henry Ford Hospital, Beaumont Hospital"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newPhysician.notes}
                        onChange={(e) => setNewPhysician((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about this physician..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddPhysicianOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addPhysician}>Add & Verify</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/physicians/export")
                    if (!response.ok) throw new Error("Export failed")
                    
                    const blob = await response.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `physicians_export_${new Date().toISOString().split("T")[0]}.csv`
                    document.body.appendChild(a)
                    a.click()
                    window.URL.revokeObjectURL(url)
                    document.body.removeChild(a)
                  } catch (err) {
                    console.error("Export error:", err)
                    setError("Failed to export physicians")
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Loading physicians...</span>
          </div>
        )}

        {/* Statistics Cards */}
        {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Stethoscope className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-gray-600 text-sm">Total Physicians</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.verified}</p>
                  <p className="text-gray-600 text-sm">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-gray-600 text-sm">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.expired}</p>
                  <p className="text-gray-600 text-sm">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{stats.expiringLicenses}</p>
                  <p className="text-gray-600 text-sm">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Search and Filter */}
        {!isLoading && (
        <>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, NPI, license number, or specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="not_verified">Not Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Physicians Table */}
        <Card>
          <CardHeader>
            <CardTitle>Ordering Physicians</CardTitle>
            <CardDescription>Manage physician credentials and CAQH verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Physician</TableHead>
                  <TableHead>NPI</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>License Expiration</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPhysicians.map((physician) => {
                  const licenseStatus = getExpirationStatus(physician.licenseExpiration)
                  return (
                    <TableRow key={physician.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {physician.firstName} {physician.lastName}
                          </div>
                          {physician.caqhId && <div className="text-sm text-gray-500">CAQH: {physician.caqhId}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{physician.npi}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{physician.licenseNumber}</div>
                          <div className="text-sm text-gray-500">{physician.licenseState}</div>
                        </div>
                      </TableCell>
                      <TableCell>{physician.specialty}</TableCell>
                      <TableCell>{getStatusBadge(physician.verificationStatus)}</TableCell>
                      <TableCell>
                        <div className={licenseStatus.color}>
                          <div className="font-medium">{physician.licenseExpiration}</div>
                          <div className="text-sm">
                            {licenseStatus.status === "expired"
                              ? `Expired ${licenseStatus.days} days ago`
                              : licenseStatus.status === "expiring"
                                ? `Expires in ${licenseStatus.days} days`
                                : `${licenseStatus.days} days remaining`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{physician.lastVerified}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verifyPhysician(physician.id)}
                            disabled={isVerifying.has(physician.id)}
                          >
                            {isVerifying.has(physician.id) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedPhysician(physician)
                              setIsViewDetailsOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Verification Results Dialog */}
        <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>CAQH Verification Results</DialogTitle>
              <DialogDescription>
                Verification results for {selectedPhysician?.firstName} {selectedPhysician?.lastName}
              </DialogDescription>
            </DialogHeader>
            {verificationResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Verification ID</Label>
                    <div className="font-mono text-sm">{verificationResults.verificationId}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="font-medium">{verificationResults.status}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Verification Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Medical License</span>
                      <Badge
                        className={
                          verificationResults.details.medicalLicense === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {verificationResults.details.medicalLicense}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Board Certification</span>
                      <Badge
                        className={
                          verificationResults.details.boardCertification === "current"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {verificationResults.details.boardCertification}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <span>Malpractice Insurance</span>
                      <Badge
                        className={
                          verificationResults.details.malpracticeInsurance === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {verificationResults.details.malpracticeInsurance}
                      </Badge>
                    </div>
                    {verificationResults.details.deaRegistration && (
                      <div className="flex items-center justify-between p-3 border rounded">
                        <span>DEA Registration</span>
                        <Badge
                          className={
                            verificationResults.details.deaRegistration === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {verificationResults.details.deaRegistration}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Expiration Dates</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">License:</span>
                      <div className="font-medium">{verificationResults.expirationDates.license}</div>
                    </div>
                    {verificationResults.expirationDates.board && (
                      <div>
                        <span className="text-gray-600">Board Certification:</span>
                        <div className="font-medium">{verificationResults.expirationDates.board}</div>
                      </div>
                    )}
                    {verificationResults.expirationDates.malpractice && (
                      <div>
                        <span className="text-gray-600">Malpractice:</span>
                        <div className="font-medium">{verificationResults.expirationDates.malpractice}</div>
                      </div>
                    )}
                    {verificationResults.expirationDates.dea && (
                      <div>
                        <span className="text-gray-600">DEA:</span>
                        <div className="font-medium">{verificationResults.expirationDates.dea}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600">Last Updated: {verificationResults.lastUpdated}</div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Physician Details Dialog */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Physician Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedPhysician?.firstName} {selectedPhysician?.lastName}
              </DialogDescription>
            </DialogHeader>
            {selectedPhysician && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Full Name</Label>
                      <div className="font-medium text-lg">
                        {selectedPhysician.firstName} {selectedPhysician.lastName}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600">NPI Number</Label>
                      <div className="font-mono font-medium">{selectedPhysician.npi}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Specialty</Label>
                      <div className="font-medium">{selectedPhysician.specialty || "Not specified"}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Verification Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedPhysician.verificationStatus)}</div>
                    </div>
                  </div>
                </div>

                {/* License Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">License Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">License Number</Label>
                      <div className="font-medium">{selectedPhysician.licenseNumber || "Not provided"}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">License State</Label>
                      <div className="font-medium">{selectedPhysician.licenseState || "Not provided"}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">License Expiration</Label>
                      {selectedPhysician.licenseExpiration ? (
                        <div className={getExpirationStatus(selectedPhysician.licenseExpiration).color}>
                          <div className="font-medium">{selectedPhysician.licenseExpiration}</div>
                          <div className="text-sm">
                            {getExpirationStatus(selectedPhysician.licenseExpiration).status === "expired"
                              ? `Expired ${getExpirationStatus(selectedPhysician.licenseExpiration).days} days ago`
                              : `${getExpirationStatus(selectedPhysician.licenseExpiration).days} days remaining`}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Not provided</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-600">Last Verified</Label>
                      <div className="font-medium">{selectedPhysician.lastVerified}</div>
                    </div>
                  </div>
                </div>

                {/* CAQH Information */}
                {selectedPhysician.caqhId && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">CAQH Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-gray-600">CAQH ID</Label>
                        <div className="font-mono font-medium">{selectedPhysician.caqhId}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Board Certification */}
                {(selectedPhysician.boardCertification || selectedPhysician.boardExpiration) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">Board Certification</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPhysician.boardCertification && (
                        <div>
                          <Label className="text-gray-600">Certification</Label>
                          <div className="font-medium">{selectedPhysician.boardCertification}</div>
                        </div>
                      )}
                      {selectedPhysician.boardExpiration && (
                        <div>
                          <Label className="text-gray-600">Expiration Date</Label>
                          <div className="font-medium">{selectedPhysician.boardExpiration}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Malpractice Insurance */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">Malpractice Insurance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Status</Label>
                      <div className="font-medium">
                        {selectedPhysician.malpracticeInsurance ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Not Active</Badge>
                        )}
                      </div>
                    </div>
                    {selectedPhysician.malpracticeExpiration && (
                      <div>
                        <Label className="text-gray-600">Expiration Date</Label>
                        <div className="font-medium">{selectedPhysician.malpracticeExpiration}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DEA Information */}
                {(selectedPhysician.deaNumber || selectedPhysician.deaExpiration) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">DEA Registration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPhysician.deaNumber && (
                        <div>
                          <Label className="text-gray-600">DEA Number</Label>
                          <div className="font-mono font-medium">{selectedPhysician.deaNumber}</div>
                        </div>
                      )}
                      {selectedPhysician.deaExpiration && (
                        <div>
                          <Label className="text-gray-600">Expiration Date</Label>
                          <div className="font-medium">{selectedPhysician.deaExpiration}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hospital Affiliations */}
                {selectedPhysician.hospitalAffiliations && selectedPhysician.hospitalAffiliations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">Hospital Affiliations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhysician.hospitalAffiliations.map((hospital, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {hospital}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedPhysician.notes && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-lg border-b pb-2">Notes</h4>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {selectedPhysician.notes}
                    </div>
                  </div>
                )}

                {/* Audit Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg border-b pb-2">Audit Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600">Added Date</Label>
                      <div className="font-medium">{selectedPhysician.addedDate}</div>
                    </div>
                    <div>
                      <Label className="text-gray-600">Added By</Label>
                      <div className="font-medium">{selectedPhysician.addedBy}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDetailsOpen(false)
                      setTimeout(() => {
                        setSelectedPhysician(selectedPhysician)
                        verifyPhysician(selectedPhysician.id)
                      }, 100)
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Verify Credentials
                  </Button>
                  <Button onClick={() => setIsViewDetailsOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </>
        )}
      </main>
    </div>
  )
}
