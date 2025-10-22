"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Camera,
  Scan,
  Package,
  DollarSign,
  User,
  MapPin,
  Clock,
  CheckCircle,
  Upload,
  BarChart3,
  TrendingUp,
  Search,
  Download,
  Calendar,
  Heart,
} from "lucide-react"
import Link from "next/link"

export default function WoundCareSupplies() {
  const [activeTab, setActiveTab] = useState("scanner")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [scannedSupply, setScannedSupply] = useState<any>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualBarcode, setManualBarcode] = useState("")
  const [usageNotes, setUsageNotes] = useState("")
  const [woundLocation, setWoundLocation] = useState("")
  const [treatmentType, setTreatmentType] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [showCostAnalysis, setShowCostAnalysis] = useState(false)
  const [recentUsage, setRecentUsage] = useState<any[]>([])
  const [dailyCosts, setDailyCosts] = useState<any[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock patient data
  const patients = [
    {
      id: "P001",
      name: "Margaret Anderson",
      room: "101A",
      mrn: "MRN-2024-001",
      diagnosis: "Diabetic foot ulcer",
      admissionDate: "2024-01-15",
      totalCost: 245.67,
      lastSupplyUsed: "2024-01-20 14:30",
    },
    {
      id: "P002",
      name: "Dorothy Williams",
      room: "102B",
      mrn: "MRN-2024-002",
      diagnosis: "Pressure ulcer stage 3",
      admissionDate: "2024-01-18",
      totalCost: 189.23,
      lastSupplyUsed: "2024-01-20 16:15",
    },
    {
      id: "P003",
      name: "James Patterson",
      room: "103A",
      mrn: "MRN-2024-003",
      diagnosis: "Post-surgical wound",
      admissionDate: "2024-01-20",
      totalCost: 67.45,
      lastSupplyUsed: "2024-01-20 10:45",
    },
  ]

  // Mock supply database with realistic wound care items
  const supplyDatabase = {
    "123456789012": {
      id: "SUP001",
      name: "Hydrocolloid Dressing 4x4",
      category: "Dressings",
      manufacturer: "ConvaTec",
      unitCost: 12.5,
      description: "Advanced wound dressing for moderate exudate",
      indications: "Pressure ulcers, diabetic ulcers, minor burns",
      contraindications: "Infected wounds, arterial ulcers",
      expirationDate: "2025-06-15",
      lotNumber: "LOT2024A123",
    },
    "234567890123": {
      id: "SUP002",
      name: "Silver Antimicrobial Foam 6x6",
      category: "Antimicrobial",
      manufacturer: "Molnlycke",
      unitCost: 28.75,
      description: "Silver-infused foam dressing for infected wounds",
      indications: "Infected wounds, high bioburden wounds",
      contraindications: "Silver sensitivity",
      expirationDate: "2025-08-20",
      lotNumber: "LOT2024B456",
    },
    "345678901234": {
      id: "SUP003",
      name: "Calcium Alginate Rope 12in",
      category: "Hemostatic",
      manufacturer: "Hollister",
      unitCost: 15.25,
      description: "Calcium alginate for deep wound packing",
      indications: "Deep wounds, tunneling, heavy exudate",
      contraindications: "Dry wounds, third-degree burns",
      expirationDate: "2025-04-10",
      lotNumber: "LOT2024C789",
    },
    "456789012345": {
      id: "SUP004",
      name: "Transparent Film Dressing 6x8",
      category: "Protective",
      manufacturer: "3M Tegaderm",
      unitCost: 8.9,
      description: "Waterproof transparent film dressing",
      indications: "IV sites, minor wounds, protection",
      contraindications: "Heavy exudate wounds",
      expirationDate: "2025-12-31",
      lotNumber: "LOT2024D012",
    },
    "567890123456": {
      id: "SUP005",
      name: "Saline Wound Cleanser 8oz",
      category: "Cleansers",
      manufacturer: "Medline",
      unitCost: 6.75,
      description: "Sterile saline solution for wound irrigation",
      indications: "Wound cleansing, irrigation",
      contraindications: "None known",
      expirationDate: "2026-01-15",
      lotNumber: "LOT2024E345",
    },
    "678901234567": {
      id: "SUP006",
      name: "Gauze Pads 4x4 Sterile (10pk)",
      category: "Gauze",
      manufacturer: "Johnson & Johnson",
      unitCost: 4.25,
      description: "Sterile gauze pads for wound coverage",
      indications: "Primary or secondary dressing",
      contraindications: "None",
      expirationDate: "2027-03-20",
      lotNumber: "LOT2024F678",
    },
    "789012345678": {
      id: "SUP007",
      name: "Medical Tape 1in x 10yd",
      category: "Tape",
      manufacturer: "3M Micropore",
      unitCost: 3.5,
      description: "Hypoallergenic medical tape",
      indications: "Securing dressings",
      contraindications: "Tape sensitivity",
      expirationDate: "2026-09-30",
      lotNumber: "LOT2024G901",
    },
    "890123456789": {
      id: "SUP008",
      name: "Wound Gel with Lidocaine 1oz",
      category: "Topical",
      manufacturer: "Medihoney",
      unitCost: 22.4,
      description: "Antimicrobial gel with pain relief",
      indications: "Painful wounds, burns",
      contraindications: "Lidocaine allergy",
      expirationDate: "2025-07-25",
      lotNumber: "LOT2024H234",
    },
    "901234567890": {
      id: "SUP009",
      name: "Compression Bandage 4in",
      category: "Compression",
      manufacturer: "Covidien",
      unitCost: 11.8,
      description: "Elastic compression bandage",
      indications: "Venous ulcers, edema control",
      contraindications: "Arterial insufficiency",
      expirationDate: "2026-11-10",
      lotNumber: "LOT2024I567",
    },
    "012345678901": {
      id: "SUP010",
      name: "Collagen Matrix Dressing 2x2",
      category: "Advanced",
      manufacturer: "Integra",
      unitCost: 45.6,
      description: "Collagen-based wound matrix",
      indications: "Chronic wounds, diabetic ulcers",
      contraindications: "Sensitivity to bovine collagen",
      expirationDate: "2025-05-18",
      lotNumber: "LOT2024J890",
    },
  }

  // Initialize camera for scanning
  const startCamera = async () => {
    try {
      setIsScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please use manual entry or image upload.")
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
    }
    setIsScanning(false)
  }

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      // Convert to blob and send for processing
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData()
          formData.append("image", blob)

          try {
            const response = await fetch("/api/supplies/scan-image", {
              method: "POST",
              body: formData,
            })
            const data = await response.json()

            if (data.success && data.barcode) {
              await processBarcode(data.barcode)
            } else {
              alert("No barcode detected. Please try again or use manual entry.")
            }
          } catch (error) {
            console.error("Error scanning image:", error)
            alert("Error processing scan. Please try again.")
          }
        }
      })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("image", file)

    try {
      const response = await fetch("/api/supplies/scan-image", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()

      if (data.success && data.barcode) {
        await processBarcode(data.barcode)
      } else {
        alert("No barcode detected in image. Please try again or use manual entry.")
      }
    } catch (error) {
      console.error("Error processing image:", error)
      alert("Error processing image. Please try again.")
    }
  }

  const processBarcode = async (barcode: string) => {
    try {
      const response = await fetch("/api/supplies/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      })
      const data = await response.json()

      if (data.success && data.supply) {
        setScannedSupply(data.supply)
        stopCamera()
      } else {
        alert("Supply not found in database. Please check barcode or add manually.")
      }
    } catch (error) {
      console.error("Error processing barcode:", error)
      alert("Error looking up supply. Please try again.")
    }
  }

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      processBarcode(manualBarcode.trim())
      setManualBarcode("")
    }
  }

  const recordSupplyUsage = async () => {
    if (!selectedPatient || !scannedSupply) {
      alert("Please select a patient and scan a supply first.")
      return
    }

    try {
      const response = await fetch("/api/supplies/record-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          supplyId: scannedSupply.id,
          quantity,
          woundLocation,
          treatmentType,
          notes: usageNotes,
          nurseId: "NURSE001", // In real app, get from auth
          timestamp: new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Supply usage recorded successfully!")

        // Reset form
        setScannedSupply(null)
        setQuantity(1)
        setWoundLocation("")
        setTreatmentType("")
        setUsageNotes("")

        // Refresh usage data
        loadRecentUsage()
      } else {
        alert("Error recording usage. Please try again.")
      }
    } catch (error) {
      console.error("Error recording usage:", error)
      alert("Error recording usage. Please try again.")
    }
  }

  const loadRecentUsage = async () => {
    try {
      const response = await fetch("/api/supplies/patient-usage?limit=10")
      const data = await response.json()

      if (data.success) {
        setRecentUsage(data.usage)
        setDailyCosts(data.dailyCosts)
      }
    } catch (error) {
      console.error("Error loading usage data:", error)
    }
  }

  useEffect(() => {
    loadRecentUsage()
  }, [])

  const getTotalCostForPatient = (patientId: string) => {
    return recentUsage
      .filter((usage) => usage.patientId === patientId)
      .reduce((total, usage) => total + usage.unitCost * usage.quantity, 0)
  }

  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {}
    recentUsage.forEach((usage) => {
      breakdown[usage.category] = (breakdown[usage.category] || 0) + usage.unitCost * usage.quantity
    })
    return breakdown
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
                <h1 className="text-2xl font-bold text-gray-900">Wound Care Supply Scanner</h1>
                <p className="text-gray-600">Track supply usage per patient for accurate cost analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-100 text-green-800">
                <Package className="h-4 w-4 mr-1" />
                Real-time Tracking
              </Badge>
              <Button onClick={() => setShowCostAnalysis(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Cost Analysis
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scanner">Supply Scanner</TabsTrigger>
            <TabsTrigger value="patients">Patient Selection</TabsTrigger>
            <TabsTrigger value="usage">Usage History</TabsTrigger>
            <TabsTrigger value="analytics">Cost Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-6">
            {/* Patient Selection Bar */}
            {selectedPatient && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-900">{selectedPatient.name}</h3>
                        <p className="text-sm text-blue-700">
                          Room {selectedPatient.room} • MRN: {selectedPatient.mrn}
                        </p>
                        <p className="text-xs text-blue-600">{selectedPatient.diagnosis}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-900">
                        ${getTotalCostForPatient(selectedPatient.id).toFixed(2)}
                      </p>
                      <p className="text-sm text-blue-700">Total Supply Cost</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Scanner Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scan className="h-5 w-5 mr-2" />
                    Barcode Scanner
                  </CardTitle>
                  <CardDescription>Scan supply barcodes using camera or upload image</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Camera Scanner */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Button
                        onClick={isScanning ? stopCamera : startCamera}
                        className={isScanning ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {isScanning ? "Stop Camera" : "Start Camera"}
                      </Button>
                      {isScanning && (
                        <Button onClick={captureAndScan} variant="outline">
                          <Scan className="h-4 w-4 mr-2" />
                          Capture & Scan
                        </Button>
                      )}
                    </div>

                    {isScanning && (
                      <div className="relative">
                        <video ref={videoRef} className="w-full h-64 bg-black rounded-lg" autoPlay playsInline />
                        <div className="absolute inset-0 border-2 border-red-500 rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-24 border-2 border-red-500 bg-red-500/20 rounded">
                            <div className="text-center text-white text-sm mt-8">Position barcode here</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                  </div>

                  {/* Image Upload */}
                  <div className="border-t pt-4">
                    <Label>Upload Barcode Image</Label>
                    <div className="mt-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>

                  {/* Manual Entry */}
                  <div className="border-t pt-4">
                    <Label htmlFor="manualBarcode">Manual Barcode Entry</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        id="manualBarcode"
                        value={manualBarcode}
                        onChange={(e) => setManualBarcode(e.target.value)}
                        placeholder="Enter barcode number"
                      />
                      <Button onClick={handleManualScan}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scanned Supply Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Scanned Supply
                  </CardTitle>
                  <CardDescription>Review supply details and record usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {scannedSupply ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-green-900">{scannedSupply.name}</h3>
                          <Badge className="bg-green-100 text-green-800">{scannedSupply.category}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Manufacturer</p>
                            <p className="font-medium">{scannedSupply.manufacturer}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Unit Cost</p>
                            <p className="font-medium text-green-700">${scannedSupply.unitCost}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Lot Number</p>
                            <p className="font-medium">{scannedSupply.lotNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expires</p>
                            <p className="font-medium">{scannedSupply.expirationDate}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm">Description</p>
                          <p className="text-sm">{scannedSupply.description}</p>
                        </div>
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm">Indications</p>
                          <p className="text-sm text-green-700">{scannedSupply.indications}</p>
                        </div>
                      </div>

                      {/* Usage Recording Form */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="quantity">Quantity Used</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="treatmentType">Treatment Type</Label>
                            <Select value={treatmentType} onValueChange={setTreatmentType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="initial-dressing">Initial Dressing</SelectItem>
                                <SelectItem value="dressing-change">Dressing Change</SelectItem>
                                <SelectItem value="wound-cleaning">Wound Cleaning</SelectItem>
                                <SelectItem value="debridement">Debridement</SelectItem>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="woundLocation">Wound Location</Label>
                          <Input
                            id="woundLocation"
                            value={woundLocation}
                            onChange={(e) => setWoundLocation(e.target.value)}
                            placeholder="e.g., Right heel, Left sacrum"
                          />
                        </div>

                        <div>
                          <Label htmlFor="usageNotes">Usage Notes</Label>
                          <Textarea
                            id="usageNotes"
                            value={usageNotes}
                            onChange={(e) => setUsageNotes(e.target.value)}
                            placeholder="Additional notes about supply usage..."
                            rows={3}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">Total Cost:</span>
                          <span className="text-lg font-bold text-green-600">
                            ${(scannedSupply.unitCost * quantity).toFixed(2)}
                          </span>
                        </div>

                        <Button
                          onClick={recordSupplyUsage}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!selectedPatient}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Record Supply Usage
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>Scan a barcode to view supply details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Patient</CardTitle>
                <CardDescription>Choose the patient for supply usage tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patients.map((patient) => (
                    <Card
                      key={patient.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPatient?.id === patient.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-medium">{patient.name}</h3>
                            <p className="text-sm text-gray-600">Room {patient.room}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            MRN: {patient.mrn}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Heart className="h-4 w-4 mr-1" />
                            {patient.diagnosis}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            Admitted: {patient.admissionDate}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-gray-600">Supply Cost:</span>
                            <span className="font-medium text-green-600">
                              ${getTotalCostForPatient(patient.id).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Supply Usage
                </CardTitle>
                <CardDescription>Track of all supply usage across patients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentUsage.length > 0 ? (
                    recentUsage.map((usage, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{usage.supplyName}</h4>
                            <p className="text-sm text-gray-600">
                              {usage.patientName} • Room {usage.room} • {usage.woundLocation}
                            </p>
                            <p className="text-xs text-gray-500">
                              {usage.treatmentType} • {new Date(usage.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(usage.unitCost * usage.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">Qty: {usage.quantity}</p>
                          <Badge variant="outline" className="text-xs">
                            {usage.category}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No supply usage recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Today's Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${recentUsage.reduce((sum, usage) => sum + usage.unitCost * usage.quantity, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Items Used</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {recentUsage.reduce((sum, usage) => sum + usage.quantity, 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Avg Cost/Patient</p>
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {patients.length > 0
                          ? (
                              recentUsage.reduce((sum, usage) => sum + usage.unitCost * usage.quantity, 0) /
                              patients.length
                            ).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Category</CardTitle>
                <CardDescription>Breakdown of supply costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(getCategoryBreakdown()).map(([category, cost]) => {
                    const total = Object.values(getCategoryBreakdown()).reduce((sum, c) => sum + c, 0)
                    const percentage = total > 0 ? (cost / total) * 100 : 0

                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{category}</span>
                          <span className="text-green-600 font-medium">${cost.toFixed(2)}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="text-xs text-gray-500 text-right">{percentage.toFixed(1)}% of total</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Patient Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Cost by Patient</CardTitle>
                <CardDescription>Supply costs per patient</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {patients.map((patient) => {
                    const patientCost = getTotalCostForPatient(patient.id)
                    return (
                      <div key={patient.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            Room {patient.room} • {patient.diagnosis}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">${patientCost.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">
                            {recentUsage.filter((u) => u.patientId === patient.id).length} items
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Cost Analysis Modal */}
        {showCostAnalysis && (
          <Dialog open={showCostAnalysis} onOpenChange={setShowCostAnalysis}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Detailed Cost Analysis</DialogTitle>
                <DialogDescription>
                  Comprehensive breakdown of wound care supply costs and usage patterns
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${recentUsage.reduce((sum, usage) => sum + usage.unitCost * usage.quantity, 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-green-700">Total Cost</p>
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {recentUsage.reduce((sum, usage) => sum + usage.quantity, 0)}
                      </p>
                      <p className="text-sm text-blue-700">Items Used</p>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{Object.keys(getCategoryBreakdown()).length}</p>
                      <p className="text-sm text-purple-700">Categories</p>
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">
                        $
                        {patients.length > 0
                          ? (
                              recentUsage.reduce((sum, usage) => sum + usage.unitCost * usage.quantity, 0) /
                              patients.length
                            ).toFixed(2)
                          : "0.00"}
                      </p>
                      <p className="text-sm text-orange-700">Avg/Patient</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Most Used Supplies</h3>
                    <div className="space-y-2">
                      {Object.entries(
                        recentUsage.reduce((acc: Record<string, any>, usage) => {
                          if (!acc[usage.supplyName]) {
                            acc[usage.supplyName] = { count: 0, cost: 0 }
                          }
                          acc[usage.supplyName].count += usage.quantity
                          acc[usage.supplyName].cost += usage.unitCost * usage.quantity
                          return acc
                        }, {}),
                      )
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 5)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{name}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">{data.count} used</span>
                              <span className="text-xs text-gray-500 block">${data.cost.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Highest Cost Supplies</h3>
                    <div className="space-y-2">
                      {Object.entries(
                        recentUsage.reduce((acc: Record<string, any>, usage) => {
                          if (!acc[usage.supplyName]) {
                            acc[usage.supplyName] = { count: 0, cost: 0 }
                          }
                          acc[usage.supplyName].count += usage.quantity
                          acc[usage.supplyName].cost += usage.unitCost * usage.quantity
                          return acc
                        }, {}),
                      )
                        .sort(([, a], [, b]) => b.cost - a.cost)
                        .slice(0, 5)
                        .map(([name, data]) => (
                          <div key={name} className="flex justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{name}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">${data.cost.toFixed(2)}</span>
                              <span className="text-xs text-gray-500 block">{data.count} used</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button onClick={() => setShowCostAnalysis(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  )
}
