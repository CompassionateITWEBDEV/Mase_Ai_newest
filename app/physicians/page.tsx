"use client"

import { useState } from "react"
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
  const [physicians, setPhysicians] = useState<Physician[]>([
    {
      id: "1",
      npi: "1234567890",
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      specialty: "Internal Medicine",
      licenseNumber: "MD123456",
      licenseState: "MI",
      licenseExpiration: "2024-12-31",
      caqhId: "CAQH123456",
      verificationStatus: "verified",
      lastVerified: "2024-01-15",
      boardCertification: "Internal Medicine",
      boardExpiration: "2025-06-30",
      malpracticeInsurance: true,
      malpracticeExpiration: "2024-08-15",
      deaNumber: "BJ1234567",
      deaExpiration: "2025-03-20",
      hospitalAffiliations: ["Henry Ford Hospital", "Beaumont Hospital"],
      addedDate: "2023-06-15",
      addedBy: "Admin User",
      notes: "Primary care physician for home health patients",
    },
    {
      id: "2",
      npi: "0987654321",
      firstName: "Dr. Michael",
      lastName: "Chen",
      specialty: "Cardiology",
      licenseNumber: "MD789012",
      licenseState: "MI",
      licenseExpiration: "2024-03-15",
      verificationStatus: "expired",
      lastVerified: "2023-12-01",
      boardCertification: "Cardiovascular Disease",
      boardExpiration: "2024-12-31",
      malpracticeInsurance: true,
      malpracticeExpiration: "2024-11-30",
      hospitalAffiliations: ["University of Michigan Hospital"],
      addedDate: "2023-08-20",
      addedBy: "Clinical Director",
      notes: "Specialist for cardiac patients",
    },
    {
      id: "3",
      npi: "1122334455",
      firstName: "Dr. Emily",
      lastName: "Rodriguez",
      specialty: "Family Medicine",
      licenseNumber: "MD345678",
      licenseState: "MI",
      licenseExpiration: "2025-09-30",
      verificationStatus: "pending",
      lastVerified: "Never",
      boardCertification: "Family Medicine",
      boardExpiration: "2025-04-15",
      malpracticeInsurance: true,
      malpracticeExpiration: "2024-07-31",
      hospitalAffiliations: ["McLaren Health Care"],
      addedDate: "2024-01-10",
      addedBy: "HR Manager",
      notes: "Recently added physician",
    },
  ])

  const [isAddPhysicianOpen, setIsAddPhysicianOpen] = useState(false)
  const [isVerificationOpen, setIsVerificationOpen] = useState(false)
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null)
  const [verificationResults, setVerificationResults] = useState<VerificationResult | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isVerifying, setIsVerifying] = useState<Set<string>>(new Set())

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
      const response = await fetch("/api/caqh/verify-physician", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ physicianId }),
      })

      if (!response.ok) throw new Error("Verification failed")

      const result = await response.json()

      // Update physician status
      setPhysicians((prev) =>
        prev.map((physician) =>
          physician.id === physicianId
            ? {
                ...physician,
                verificationStatus: result.status === "verified" ? "verified" : "error",
                lastVerified: new Date().toISOString().split("T")[0],
                caqhId: result.caqhId,
              }
            : physician,
        ),
      )

      setVerificationResults(result)
      setSelectedPhysician(physicians.find((p) => p.id === physicianId) || null)
      setIsVerificationOpen(true)
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setIsVerifying((prev) => {
        const newSet = new Set(prev)
        newSet.delete(physicianId)
        return newSet
      })
    }
  }

  const addPhysician = async () => {
    const physician: Physician = {
      id: Date.now().toString(),
      npi: newPhysician.npi,
      firstName: newPhysician.firstName,
      lastName: newPhysician.lastName,
      specialty: newPhysician.specialty,
      licenseNumber: newPhysician.licenseNumber,
      licenseState: newPhysician.licenseState,
      licenseExpiration: newPhysician.licenseExpiration,
      verificationStatus: "not_verified",
      lastVerified: "Never",
      boardCertification: newPhysician.boardCertification,
      boardExpiration: newPhysician.boardExpiration,
      malpracticeInsurance: true,
      deaNumber: newPhysician.deaNumber,
      deaExpiration: newPhysician.deaExpiration,
      hospitalAffiliations: newPhysician.hospitalAffiliations.split(",").map((s) => s.trim()),
      addedDate: new Date().toISOString().split("T")[0],
      addedBy: "Current User",
      notes: newPhysician.notes,
    }

    setPhysicians((prev) => [...prev, physician])
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

    // Automatically start verification
    setTimeout(() => verifyPhysician(physician.id), 1000)
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
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
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

        {/* Search and Filter */}
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
                          <Button size="sm" variant="outline">
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
      </main>
    </div>
  )
}
