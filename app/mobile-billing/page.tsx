"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  DollarSign,
  Clock,
  MapPin,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  FolderSyncIcon as Sync,
  Database,
  Activity,
} from "lucide-react"
import { toast } from "sonner"

interface BillingRecord {
  id: string
  patientName: string
  patientId: string
  episodeId: string
  serviceDate: string
  serviceType: string
  discipline: string
  staffMember: string
  duration: number
  mileage: number
  serviceCode: string
  rate: number
  amount: number
  status: "draft" | "submitted" | "approved" | "paid" | "rejected"
  authorizationNumber?: string
  notes?: string
  lastSyncTime?: string
  syncStatus: "synced" | "pending" | "error"
  axxessRecordId?: string
}

interface SyncStatus {
  isOnline: boolean
  lastSync: string
  syncInProgress: boolean
  recordsToSync: number
  totalRecords: number
}

export default function MobileBillingPage() {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    lastSync: new Date().toISOString(),
    syncInProgress: false,
    recordsToSync: 0,
    totalRecords: 0,
  })
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null)
  const [isAddingRecord, setIsAddingRecord] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [newRecord, setNewRecord] = useState<Partial<BillingRecord>>({
    serviceDate: new Date().toISOString().split("T")[0],
    status: "draft",
    syncStatus: "pending",
  })

  // Simulate network status
  useEffect(() => {
    const checkOnlineStatus = () => {
      setSyncStatus((prev) => ({ ...prev, isOnline: navigator.onLine }))
    }

    window.addEventListener("online", checkOnlineStatus)
    window.addEventListener("offline", checkOnlineStatus)

    return () => {
      window.removeEventListener("online", checkOnlineStatus)
      window.removeEventListener("offline", checkOnlineStatus)
    }
  }, [])

  // Auto-sync every 5 minutes when online
  useEffect(() => {
    if (syncStatus.isOnline) {
      const interval = setInterval(
        () => {
          syncWithAxxess()
        },
        5 * 60 * 1000,
      ) // 5 minutes

      return () => clearInterval(interval)
    }
  }, [syncStatus.isOnline])

  // Load initial data
  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      // Load from local storage first
      const localData = localStorage.getItem("mobileBillingRecords")
      if (localData) {
        const records = JSON.parse(localData)
        setBillingRecords(records)
        updateSyncStatus(records)
      }

      // Then sync with Axxess if online
      if (syncStatus.isOnline) {
        await syncWithAxxess()
      }
    } catch (error) {
      console.error("Error loading billing data:", error)
      toast.error("Failed to load billing data")
    }
  }

  const syncWithAxxess = async () => {
    if (syncStatus.syncInProgress) return

    setSyncStatus((prev) => ({ ...prev, syncInProgress: true }))

    try {
      // Sync billing data with Axxess
      const response = await fetch("/api/axxess/billing-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: billingRecords }),
      })

      if (!response.ok) throw new Error("Sync failed")

      const { syncedRecords, conflicts } = await response.json()

      // Update records with synced data
      const updatedRecords = billingRecords.map((record) => {
        const syncedRecord = syncedRecords.find((sr: any) => sr.id === record.id)
        if (syncedRecord) {
          return {
            ...record,
            ...syncedRecord,
            syncStatus: "synced" as const,
            lastSyncTime: new Date().toISOString(),
          }
        }
        return record
      })

      setBillingRecords(updatedRecords)
      localStorage.setItem("mobileBillingRecords", JSON.stringify(updatedRecords))

      setSyncStatus((prev) => ({
        ...prev,
        lastSync: new Date().toISOString(),
        syncInProgress: false,
      }))

      updateSyncStatus(updatedRecords)
      toast.success(`Synced ${syncedRecords.length} records with Axxess`)

      if (conflicts && conflicts.length > 0) {
        toast.warning(`${conflicts.length} conflicts detected - manual review required`)
      }
    } catch (error) {
      console.error("Sync error:", error)
      setSyncStatus((prev) => ({ ...prev, syncInProgress: false }))
      toast.error("Failed to sync with Axxess")
    }
  }

  const updateSyncStatus = (records: BillingRecord[]) => {
    const pendingRecords = records.filter((r) => r.syncStatus === "pending").length
    setSyncStatus((prev) => ({
      ...prev,
      recordsToSync: pendingRecords,
      totalRecords: records.length,
    }))
  }

  const addBillingRecord = async () => {
    if (!newRecord.patientName || !newRecord.serviceType || !newRecord.duration) {
      toast.error("Please fill in all required fields")
      return
    }

    const record: BillingRecord = {
      id: `mobile_${Date.now()}`,
      patientName: newRecord.patientName!,
      patientId: newRecord.patientId || "",
      episodeId: newRecord.episodeId || "",
      serviceDate: newRecord.serviceDate!,
      serviceType: newRecord.serviceType!,
      discipline: newRecord.discipline || "Nursing",
      staffMember: newRecord.staffMember || "Current User",
      duration: newRecord.duration!,
      mileage: newRecord.mileage || 0,
      serviceCode: newRecord.serviceCode || "G0154",
      rate: newRecord.rate || 85.0,
      amount: (newRecord.duration! / 60) * (newRecord.rate || 85.0),
      status: "draft",
      authorizationNumber: newRecord.authorizationNumber,
      notes: newRecord.notes,
      syncStatus: "pending",
    }

    const updatedRecords = [...billingRecords, record]
    setBillingRecords(updatedRecords)
    localStorage.setItem("mobileBillingRecords", JSON.stringify(updatedRecords))
    updateSyncStatus(updatedRecords)

    setNewRecord({
      serviceDate: new Date().toISOString().split("T")[0],
      status: "draft",
      syncStatus: "pending",
    })
    setIsAddingRecord(false)
    toast.success("Billing record added")

    // Auto-sync if online
    if (syncStatus.isOnline) {
      setTimeout(() => syncWithAxxess(), 1000)
    }
  }

  const updateRecordStatus = async (recordId: string, newStatus: BillingRecord["status"]) => {
    const updatedRecords = billingRecords.map((record) =>
      record.id === recordId ? { ...record, status: newStatus, syncStatus: "pending" as const } : record,
    )

    setBillingRecords(updatedRecords)
    localStorage.setItem("mobileBillingRecords", JSON.stringify(updatedRecords))
    updateSyncStatus(updatedRecords)
    toast.success(`Record status updated to ${newStatus}`)

    // Auto-sync if online
    if (syncStatus.isOnline) {
      setTimeout(() => syncWithAxxess(), 1000)
    }
  }

  const exportData = async (format: "pdf" | "excel" | "csv") => {
    try {
      const response = await fetch("/api/mobile-billing/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: billingRecords, format }),
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `billing-records.${format}`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success(`Data exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export data")
    }
  }

  const filteredRecords = billingRecords.filter((record) => {
    const matchesSearch =
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0)
  const totalHours = filteredRecords.reduce((sum, record) => sum + record.duration, 0) / 60
  const totalMileage = filteredRecords.reduce((sum, record) => sum + record.mileage, 0)

  const getSyncStatusIcon = (status: BillingRecord["syncStatus"]) => {
    switch (status) {
      case "synced":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: BillingRecord["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800"
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "paid":
        return "bg-emerald-100 text-emerald-800"
      case "rejected":
        return "bg-red-100 text-red-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Mobile Billing</h1>
          </div>
          <div className="flex items-center gap-2">
            {syncStatus.isOnline ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={syncWithAxxess}
              disabled={syncStatus.syncInProgress || !syncStatus.isOnline}
            >
              {syncStatus.syncInProgress ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sync className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Sync Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="text-sm font-medium">Axxess Sync</span>
              </div>
              <Badge variant={syncStatus.isOnline ? "default" : "destructive"}>
                {syncStatus.isOnline ? "Online" : "Offline"}
              </Badge>
            </div>

            {syncStatus.recordsToSync > 0 && (
              <Alert className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{syncStatus.recordsToSync} records pending sync</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500">Last sync: {new Date(syncStatus.lastSync).toLocaleString()}</div>

            {syncStatus.syncInProgress && (
              <div className="mt-2">
                <Progress value={75} className="h-2" />
                <div className="text-xs text-gray-500 mt-1">Syncing with Axxess...</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold">${totalAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
              <div className="text-lg font-bold">{totalHours.toFixed(1)}h</div>
              <div className="text-xs text-gray-500">Hours</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <MapPin className="h-4 w-4 mx-auto mb-1 text-purple-600" />
              <div className="text-lg font-bold">{totalMileage}</div>
              <div className="text-xs text-gray-500">Miles</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="space-y-2">
          <Input
            placeholder="Search patients or services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Dialog open={isAddingRecord} onOpenChange={setIsAddingRecord}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Add Billing Record</DialogTitle>
                <DialogDescription>Create a new billing record for patient services</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name *</Label>
                  <Input
                    id="patientName"
                    value={newRecord.patientName || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, patientName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="episodeId">Episode ID</Label>
                  <Input
                    id="episodeId"
                    value={newRecord.episodeId || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, episodeId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceDate">Service Date *</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={newRecord.serviceDate || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, serviceDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={newRecord.serviceType || ""}
                    onValueChange={(value) => setNewRecord((prev) => ({ ...prev, serviceType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Skilled Nursing">Skilled Nursing</SelectItem>
                      <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                      <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                      <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                      <SelectItem value="Home Health Aide">Home Health Aide</SelectItem>
                      <SelectItem value="Medical Social Work">Medical Social Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newRecord.duration || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="mileage">Mileage</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={newRecord.mileage || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, mileage: Number.parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="authNumber">Authorization Number</Label>
                  <Input
                    id="authNumber"
                    value={newRecord.authorizationNumber || ""}
                    onChange={(e) => setNewRecord((prev) => ({ ...prev, authorizationNumber: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addBillingRecord} className="flex-1">
                    Add Record
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddingRecord(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => exportData("pdf")}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Billing Records */}
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{record.patientName}</div>
                    <div className="text-sm text-gray-500">{record.serviceType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSyncStatusIcon(record.syncStatus)}
                    <Badge className={getStatusColor(record.status)}>{record.status}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div>{new Date(record.serviceDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Duration</div>
                    <div>{record.duration} min</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Amount</div>
                    <div className="font-medium">${record.amount.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Mileage</div>
                    <div>{record.mileage} mi</div>
                  </div>
                </div>

                {record.episodeId && <div className="mt-2 text-xs text-gray-500">Episode: {record.episodeId}</div>}

                {record.authorizationNumber && (
                  <div className="text-xs text-gray-500">Auth: {record.authorizationNumber}</div>
                )}

                <Separator className="my-3" />

                <div className="flex gap-2">
                  {record.status === "draft" && (
                    <Button size="sm" onClick={() => updateRecordStatus(record.id, "submitted")}>
                      Submit
                    </Button>
                  )}
                  {record.status === "submitted" && (
                    <Button size="sm" variant="outline" onClick={() => updateRecordStatus(record.id, "approved")}>
                      Approve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setSelectedRecord(record)}>
                    <FileText className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="text-gray-500">No billing records found</div>
              <Button className="mt-4" onClick={() => setIsAddingRecord(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Record
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Record Details Dialog */}
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Billing Record Details</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Patient</div>
                    <div className="font-medium">{selectedRecord.patientName}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Status</div>
                    <Badge className={getStatusColor(selectedRecord.status)}>{selectedRecord.status}</Badge>
                  </div>
                  <div>
                    <div className="text-gray-500">Service Date</div>
                    <div>{new Date(selectedRecord.serviceDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Service Type</div>
                    <div>{selectedRecord.serviceType}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Discipline</div>
                    <div>{selectedRecord.discipline}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Staff</div>
                    <div>{selectedRecord.staffMember}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Duration</div>
                    <div>{selectedRecord.duration} minutes</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Rate</div>
                    <div>${selectedRecord.rate.toFixed(2)}/hr</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Mileage</div>
                    <div>{selectedRecord.mileage} miles</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Amount</div>
                    <div className="font-medium text-lg">${selectedRecord.amount.toFixed(2)}</div>
                  </div>
                </div>

                {selectedRecord.episodeId && (
                  <div>
                    <div className="text-gray-500 text-sm">Episode ID</div>
                    <div className="font-mono text-sm">{selectedRecord.episodeId}</div>
                  </div>
                )}

                {selectedRecord.authorizationNumber && (
                  <div>
                    <div className="text-gray-500 text-sm">Authorization</div>
                    <div className="font-mono text-sm">{selectedRecord.authorizationNumber}</div>
                  </div>
                )}

                {selectedRecord.notes && (
                  <div>
                    <div className="text-gray-500 text-sm">Notes</div>
                    <div className="text-sm">{selectedRecord.notes}</div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  {getSyncStatusIcon(selectedRecord.syncStatus)}
                  <span className="text-gray-500">Sync Status: {selectedRecord.syncStatus}</span>
                </div>

                {selectedRecord.lastSyncTime && (
                  <div className="text-xs text-gray-500">
                    Last synced: {new Date(selectedRecord.lastSyncTime).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
