"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Camera,
  Scan,
  FileText,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  Pill,
  User,
  Clock,
  Shield,
  Zap,
  Upload,
  Download,
  RefreshCw,
  Plus,
  Edit,
  Save,
  X,
  Lightbulb,
  Heart,
  Brain,
  Activity,
  QrCode,
  BarChart3,
  Target,
} from "lucide-react"
import { DrugInteractionAlert } from "@/components/drug-interaction-alert"

interface ScannedMedication {
  id: string
  name: string
  genericName?: string
  dosage: string
  strength: string
  ndc: string
  manufacturer: string
  lotNumber?: string
  expirationDate?: string
  instructions: string
  sideEffects: string[]
  interactions: string[]
  contraindications: string[]
  category: string
  schedule?: string
  confidence: number
  scanTimestamp: string
  imageUrl?: string
  scanMethod: "ocr" | "barcode" | "qr" | "manual"
  barcodeData?: string
}

interface Patient {
  id: string
  name: string
  dob: string
  mrn: string
  allergies: string[]
  currentMedications: string[]
  conditions: string[]
  axxessId: string
}

interface MedicationEducation {
  category: string
  title: string
  content: string
  tips: string[]
  warnings: string[]
  resources: string[]
}

interface BarcodeResult {
  format: string
  text: string
  rawBytes?: Uint8Array
}

export default function NurseMedicationScanner() {
  const [activeTab, setActiveTab] = useState("scanner")
  const [scanMode, setScanMode] = useState<"ocr" | "barcode">("barcode")
  const [isScanning, setIsScanning] = useState(false)
  const [scannedMedication, setScannedMedication] = useState<ScannedMedication | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medicationHistory, setMedicationHistory] = useState<ScannedMedication[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [educationContent, setEducationContent] = useState<MedicationEducation[]>([])
  const [barcodeDetected, setBarcodeDetected] = useState<BarcodeResult | null>(null)
  const [manualEntry, setManualEntry] = useState({
    name: "",
    dosage: "",
    strength: "",
    instructions: "",
    frequency: "",
    route: "",
  })
  const [showEducation, setShowEducation] = useState(false)
  const [currentEducation, setCurrentEducation] = useState<MedicationEducation | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const barcodeDetectorRef = useRef<any>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Mock patients data
  const patients: Patient[] = [
    {
      id: "PT-001",
      name: "Margaret Anderson",
      dob: "01/15/1950",
      mrn: "MRN-12345",
      allergies: ["Penicillin", "Sulfa"],
      currentMedications: ["Lisinopril 10mg", "Metformin 500mg"],
      conditions: ["Diabetes Type 2", "Hypertension"],
      axxessId: "AX-PT-789456",
    },
    {
      id: "PT-002",
      name: "Robert Thompson",
      dob: "03/22/1948",
      mrn: "MRN-12346",
      allergies: ["Aspirin"],
      currentMedications: ["Warfarin 5mg", "Digoxin 0.25mg"],
      conditions: ["Atrial Fibrillation", "Heart Failure"],
      axxessId: "AX-PT-789457",
    },
  ]

  // Mock education content
  useEffect(() => {
    const mockEducation: MedicationEducation[] = [
      {
        category: "Diabetes Medications",
        title: "Metformin Administration Guide",
        content:
          "Metformin is a first-line medication for Type 2 diabetes. It works by decreasing glucose production in the liver and improving insulin sensitivity.",
        tips: [
          "Take with meals to reduce GI upset",
          "Monitor for signs of lactic acidosis",
          "Check kidney function regularly",
          "Start with low dose and titrate up",
        ],
        warnings: [
          "Contraindicated in severe kidney disease",
          "Hold before contrast procedures",
          "Monitor for vitamin B12 deficiency",
        ],
        resources: ["ADA Diabetes Guidelines", "Metformin Patient Education Sheet", "Drug Interaction Checker"],
      },
      {
        category: "Cardiovascular Medications",
        title: "ACE Inhibitor Safety",
        content:
          "ACE inhibitors like Lisinopril are cornerstone therapy for hypertension and heart failure. They block the conversion of angiotensin I to angiotensin II.",
        tips: [
          "Monitor blood pressure regularly",
          "Check potassium levels",
          "Watch for dry cough",
          "Take at same time daily",
        ],
        warnings: [
          "Risk of hyperkalemia",
          "Angioedema is rare but serious",
          "Avoid in pregnancy",
          "Monitor kidney function",
        ],
        resources: ["AHA Hypertension Guidelines", "ACE Inhibitor Patient Guide", "Blood Pressure Monitoring Log"],
      },
    ]
    setEducationContent(mockEducation)
  }, [])

  // Initialize barcode detector
  useEffect(() => {
    const initBarcodeDetector = async () => {
      if ("BarcodeDetector" in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "data_matrix"],
          })
          barcodeDetectorRef.current = detector
          console.log("Native BarcodeDetector initialized")
        } catch (error) {
          console.error("Failed to initialize BarcodeDetector:", error)
        }
      } else {
        // Fallback to ZXing library for browsers without native support
        console.log("Using ZXing fallback for barcode detection")
      }
    }

    initBarcodeDetector()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)

        // Start barcode scanning if in barcode mode
        if (scanMode === "barcode") {
          startBarcodeScanning()
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    stopBarcodeScanning()
  }

  const startBarcodeScanning = () => {
    if (!barcodeDetectorRef.current || !videoRef.current) return

    const scanBarcodes = async () => {
      if (!videoRef.current || videoRef.current.readyState !== 4) return

      try {
        const barcodes = await barcodeDetectorRef.current.detect(videoRef.current)

        if (barcodes.length > 0) {
          const barcode = barcodes[0]
          setBarcodeDetected({
            format: barcode.format,
            text: barcode.rawValue,
          })

          // Process the barcode immediately
          await processBarcodeData(barcode.rawValue, barcode.format)
          stopBarcodeScanning()
        }
      } catch (error) {
        console.error("Barcode detection error:", error)
      }
    }

    // Scan every 500ms
    scanIntervalRef.current = setInterval(scanBarcodes, 500)
  }

  const stopBarcodeScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setBarcodeDetected(null)
  }

  const processBarcodeData = async (barcodeText: string, format: string) => {
    setIsProcessing(true)
    setScanProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 15
        })
      }, 150)

      console.log(`Processing barcode: ${barcodeText} (${format})`)

      const response = await fetch("/api/nurse-scanner/scan-barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcodeData: barcodeText,
          format: format,
          patientId: selectedPatient?.id || "",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setScanProgress(100)
        setScannedMedication(data.medication)
        setMedicationHistory((prev) => [data.medication, ...prev])

        // Load relevant education content
        const relevantEducation = educationContent.find((edu) =>
          data.medication.name.toLowerCase().includes(edu.category.toLowerCase().split(" ")[0]),
        )
        if (relevantEducation) {
          setCurrentEducation(relevantEducation)
          setShowEducation(true)
        }

        stopCamera()
      } else {
        throw new Error(data.message || "Failed to process barcode")
      }
    } catch (error) {
      console.error("Error processing barcode:", error)
      alert("Failed to process barcode. Please try OCR scanning or enter manually.")
    } finally {
      setIsProcessing(false)
      setScanProgress(0)
    }
  }

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext("2d")

    if (context) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0)

      // Convert to blob and process
      canvas.toBlob(async (blob) => {
        if (blob) {
          if (scanMode === "ocr") {
            await processMedicationImage(blob)
          } else {
            // Try barcode detection on captured image
            await processCapturedImageForBarcode(blob)
          }
        }
      }, "image/jpeg")
    }
  }

  const processCapturedImageForBarcode = async (imageBlob: Blob) => {
    setIsProcessing(true)
    setScanProgress(0)

    try {
      const formData = new FormData()
      formData.append("image", imageBlob)
      formData.append("patientId", selectedPatient?.id || "")

      const response = await fetch("/api/nurse-scanner/scan-barcode-image", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setScanProgress(100)
        setScannedMedication(data.medication)
        setMedicationHistory((prev) => [data.medication, ...prev])
        stopCamera()
      } else {
        throw new Error(data.message || "No barcode detected in image")
      }
    } catch (error) {
      console.error("Error processing barcode from image:", error)
      alert("No barcode detected. Try positioning the barcode clearly in the frame or use OCR mode.")
    } finally {
      setIsProcessing(false)
      setScanProgress(0)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (scanMode === "ocr") {
        await processMedicationImage(file)
      } else {
        await processCapturedImageForBarcode(file)
      }
    }
  }

  const processMedicationImage = async (imageBlob: Blob) => {
    setIsProcessing(true)
    setScanProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const formData = new FormData()
      formData.append("image", imageBlob)
      formData.append("patientId", selectedPatient?.id || "")

      const response = await fetch("/api/nurse-scanner/scan-medication", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setScanProgress(100)
        setScannedMedication(data.medication)
        setMedicationHistory((prev) => [data.medication, ...prev])

        // Load relevant education content
        const relevantEducation = educationContent.find((edu) =>
          data.medication.name.toLowerCase().includes(edu.category.toLowerCase().split(" ")[0]),
        )
        if (relevantEducation) {
          setCurrentEducation(relevantEducation)
          setShowEducation(true)
        }

        stopCamera()
      } else {
        throw new Error(data.message || "Failed to scan medication")
      }
    } catch (error) {
      console.error("Error processing medication:", error)
      alert("Failed to process medication. Please try again or enter manually.")
    } finally {
      setIsProcessing(false)
      setScanProgress(0)
    }
  }

  const addToPatientChart = async () => {
    if (!scannedMedication || !selectedPatient) return

    try {
      const response = await fetch("/api/axxess/add-medication", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.axxessId,
          medication: scannedMedication,
          nurseId: "NURSE-001", // In real app, get from auth
          nurseName: "Sarah Johnson, RN",
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert("Medication successfully added to patient chart in Axxess!")
        setScannedMedication(null)
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("Error adding to Axxess:", error)
      alert("Failed to add medication to Axxess. Please try again.")
    }
  }

  const generateMedicationSheet = async () => {
    if (!scannedMedication || !selectedPatient) return

    try {
      const response = await fetch("/api/nurse-scanner/generate-med-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: selectedPatient,
          medication: scannedMedication,
          nurseId: "NURSE-001",
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Download the generated PDF
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = `medication-sheet-${selectedPatient.name}-${Date.now()}.pdf`
        link.click()
      }
    } catch (error) {
      console.error("Error generating medication sheet:", error)
      alert("Failed to generate medication sheet.")
    }
  }

  const submitManualEntry = async () => {
    if (!manualEntry.name || !manualEntry.dosage) {
      alert("Please fill in medication name and dosage.")
      return
    }

    const manualMedication: ScannedMedication = {
      id: `MAN-${Date.now()}`,
      name: manualEntry.name,
      dosage: manualEntry.dosage,
      strength: manualEntry.strength,
      ndc: "Manual Entry",
      manufacturer: "Unknown",
      instructions: manualEntry.instructions,
      sideEffects: [],
      interactions: [],
      contraindications: [],
      category: "Manual Entry",
      confidence: 100,
      scanTimestamp: new Date().toISOString(),
      scanMethod: "manual",
    }

    setScannedMedication(manualMedication)
    setMedicationHistory((prev) => [manualMedication, ...prev])
    setManualEntry({ name: "", dosage: "", strength: "", instructions: "", frequency: "", route: "" })
  }

  const getScanMethodIcon = (method: string) => {
    switch (method) {
      case "barcode":
        return <BarChart3 className="h-3 w-3" />
      case "qr":
        return <QrCode className="h-3 w-3" />
      case "ocr":
        return <Scan className="h-3 w-3" />
      default:
        return <Edit className="h-3 w-3" />
    }
  }

  const getScanMethodColor = (method: string) => {
    switch (method) {
      case "barcode":
        return "bg-blue-100 text-blue-800"
      case "qr":
        return "bg-purple-100 text-purple-800"
      case "ocr":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nurse Medication Scanner</h1>
            <p className="text-gray-600">
              Scan barcodes, QR codes, or text labels for instant medication identification
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge className="bg-green-100 text-green-800">
              <Zap className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <QrCode className="h-3 w-3 mr-1" />
              Barcode Ready
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              <Shield className="h-3 w-3 mr-1" />
              HIPAA Compliant
            </Badge>
          </div>
        </div>

        {/* Patient Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Select Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={selectedPatient?.id || ""}
                onValueChange={(value) => {
                  const patient = patients.find((p) => p.id === value)
                  setSelectedPatient(patient || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} - {patient.mrn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPatient && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{selectedPatient.name}</span>
                    <Badge className="bg-blue-100 text-blue-800">{selectedPatient.mrn}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>DOB: {selectedPatient.dob}</p>
                    <p>Allergies: {selectedPatient.allergies.join(", ")}</p>
                    <p>Current Meds: {selectedPatient.currentMedications.length}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="sheets">Med Sheets</TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="space-y-6">
            {/* Scan Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Scanning Mode
                </CardTitle>
                <CardDescription>Choose your preferred scanning method for optimal accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant={scanMode === "barcode" ? "default" : "outline"}
                    onClick={() => setScanMode("barcode")}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <QrCode className="h-6 w-6" />
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <div className="font-medium">Barcode/QR Scanner</div>
                      <div className="text-xs text-muted-foreground">Fast & accurate NDC lookup</div>
                    </div>
                  </Button>

                  <Button
                    variant={scanMode === "ocr" ? "default" : "outline"}
                    onClick={() => setScanMode("ocr")}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                  >
                    <Scan className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">Text Recognition (OCR)</div>
                      <div className="text-xs text-muted-foreground">Read medication labels</div>
                    </div>
                  </Button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>Tip:</strong>{" "}
                      {scanMode === "barcode"
                        ? "Barcode scanning is fastest and most accurate. Look for barcodes on medication packaging or bottles."
                        : "OCR works best with clear, well-lit medication labels. Hold steady for best results."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Camera Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  {scanMode === "barcode" ? "Barcode/QR Code Scanner" : "Medication Label Scanner"}
                </CardTitle>
                <CardDescription>
                  {scanMode === "barcode"
                    ? "Point camera at barcode or QR code for instant medication lookup"
                    : "Point camera at medication label or upload an image for text recognition"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isScanning ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button onClick={startCamera} className="h-24 flex flex-col items-center justify-center">
                        <Camera className="h-8 w-8 mb-2" />
                        Start Camera
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-24 flex flex-col items-center justify-center"
                      >
                        <Upload className="h-8 w-8 mb-2" />
                        Upload Image
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full max-w-md mx-auto rounded-lg border"
                      />

                      {/* Barcode scanning overlay */}
                      {scanMode === "barcode" ? (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-20 border-2 border-white rounded-lg">
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white"></div>
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                              Position barcode here
                            </div>
                          </div>
                          {barcodeDetected && (
                            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Barcode Detected!
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-white rounded-lg">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center space-x-4">
                      {scanMode === "barcode" ? (
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2">
                            {barcodeDetected ? "Processing barcode..." : "Scanning for barcodes..."}
                          </div>
                          <Button variant="outline" onClick={stopCamera}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button onClick={captureImage} disabled={isProcessing}>
                            <Scan className="h-4 w-4 mr-2" />
                            Capture & Scan
                          </Button>
                          <Button variant="outline" onClick={stopCamera}>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {scanMode === "barcode" ? "Looking up barcode..." : "Processing medication..."}
                      </span>
                      <span className="text-sm text-gray-500">{scanProgress}%</span>
                    </div>
                    <Progress value={scanProgress} className="w-full" />
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>

            {/* Scanned Medication Results */}
            {scannedMedication && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Scanned Medication
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-4">
                    <span>Confidence: {scannedMedication.confidence}%</span>
                    <Badge className={getScanMethodColor(scannedMedication.scanMethod)}>
                      {getScanMethodIcon(scannedMedication.scanMethod)}
                      <span className="ml-1 capitalize">{scannedMedication.scanMethod}</span>
                    </Badge>
                    <span>Scanned at {new Date(scannedMedication.scanTimestamp).toLocaleString()}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Medication Name</Label>
                        <p className="text-lg font-semibold text-blue-600">{scannedMedication.name}</p>
                        {scannedMedication.genericName && (
                          <p className="text-sm text-gray-600">Generic: {scannedMedication.genericName}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">Dosage</Label>
                          <p>{scannedMedication.dosage}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Strength</Label>
                          <p>{scannedMedication.strength}</p>
                        </div>
                      </div>

                      <div>
                        <Label className="font-medium">Instructions</Label>
                        <p className="text-sm">{scannedMedication.instructions}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">NDC</Label>
                          <p className="font-mono text-sm">{scannedMedication.ndc}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Manufacturer</Label>
                          <p className="text-sm">{scannedMedication.manufacturer}</p>
                        </div>
                      </div>

                      {scannedMedication.barcodeData && (
                        <div>
                          <Label className="font-medium">Barcode Data</Label>
                          <p className="font-mono text-xs bg-gray-100 p-2 rounded">{scannedMedication.barcodeData}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {scannedMedication.sideEffects.length > 0 && (
                        <div>
                          <Label className="font-medium text-orange-600">Common Side Effects</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {scannedMedication.sideEffects.map((effect, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {scannedMedication.interactions.length > 0 && (
                        <div>
                          <Label className="font-medium text-red-600">Drug Interactions</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {scannedMedication.interactions.map((interaction, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-red-300">
                                {interaction}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {scannedMedication.contraindications.length > 0 && (
                        <div>
                          <Label className="font-medium text-red-600">Contraindications</Label>
                          <div className="space-y-1 mt-1">
                            {scannedMedication.contraindications.map((contra, index) => (
                              <div key={index} className="text-xs p-2 bg-red-50 rounded border-l-2 border-red-300">
                                {contra}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Safety Checks */}
                  {selectedPatient && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Patient Safety Checks
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedPatient.allergies.some((allergy) =>
                          scannedMedication.name.toLowerCase().includes(allergy.toLowerCase()),
                        ) && (
                          <div className="text-red-600 font-medium">
                            ⚠️ ALLERGY ALERT: Patient is allergic to components in this medication
                          </div>
                        )}
                        {selectedPatient.currentMedications.some((med) =>
                          scannedMedication.interactions.some((interaction) =>
                            med.toLowerCase().includes(interaction.toLowerCase()),
                          ),
                        ) && (
                          <div className="text-orange-600 font-medium">
                            ⚠️ INTERACTION ALERT: May interact with current medications
                          </div>
                        )}
                        <div className="text-green-600">
                          ✓ Medication dosage within normal range for patient age group
                        </div>
                        {scannedMedication.scanMethod === "barcode" && (
                          <div className="text-blue-600">
                            ✓ Barcode verification ensures accurate medication identification
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Drug Interaction Checking */}
                  {scannedMedication && selectedPatient && (
                    <DrugInteractionAlert
                      newMedication={{
                        name: scannedMedication.name,
                        genericName: scannedMedication.genericName,
                        dosage: scannedMedication.dosage,
                        ndc: scannedMedication.ndc,
                      }}
                      currentMedications={selectedPatient.currentMedications.map((med) => ({
                        name: med,
                        genericName: undefined,
                        dosage: undefined,
                      }))}
                      patientId={selectedPatient.id}
                      onInteractionCheck={(result) => {
                        console.log("Interaction check result:", result)
                        // You can add additional logic here, such as:
                        // - Logging interactions for audit purposes
                        // - Sending alerts to supervising nurses
                        // - Updating patient safety flags
                      }}
                      autoCheck={true}
                    />
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={addToPatientChart} disabled={!selectedPatient}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Axxess Chart
                    </Button>
                    <Button variant="outline" onClick={generateMedicationSheet} disabled={!selectedPatient}>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Med Sheet
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowEducation(true)
                        // Find relevant education
                        const education = educationContent.find((edu) =>
                          scannedMedication.name.toLowerCase().includes(edu.category.toLowerCase().split(" ")[0]),
                        )
                        setCurrentEducation(education || null)
                      }}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Education
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  Manual Medication Entry
                </CardTitle>
                <CardDescription>Enter medication information manually when scanning is not available</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="med-name">Medication Name *</Label>
                    <Input
                      id="med-name"
                      value={manualEntry.name}
                      onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                      placeholder="e.g., Lisinopril"
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-dosage">Dosage *</Label>
                    <Input
                      id="med-dosage"
                      value={manualEntry.dosage}
                      onChange={(e) => setManualEntry({ ...manualEntry, dosage: e.target.value })}
                      placeholder="e.g., 10mg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-strength">Strength</Label>
                    <Input
                      id="med-strength"
                      value={manualEntry.strength}
                      onChange={(e) => setManualEntry({ ...manualEntry, strength: e.target.value })}
                      placeholder="e.g., 10mg/tablet"
                    />
                  </div>
                  <div>
                    <Label htmlFor="med-frequency">Frequency</Label>
                    <Select
                      value={manualEntry.frequency}
                      onValueChange={(value) => setManualEntry({ ...manualEntry, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once-daily">Once daily</SelectItem>
                        <SelectItem value="twice-daily">Twice daily</SelectItem>
                        <SelectItem value="three-times-daily">Three times daily</SelectItem>
                        <SelectItem value="four-times-daily">Four times daily</SelectItem>
                        <SelectItem value="as-needed">As needed</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="med-route">Route</Label>
                    <Select
                      value={manualEntry.route}
                      onValueChange={(value) => setManualEntry({ ...manualEntry, route: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="sublingual">Sublingual</SelectItem>
                        <SelectItem value="topical">Topical</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="inhalation">Inhalation</SelectItem>
                        <SelectItem value="rectal">Rectal</SelectItem>
                        <SelectItem value="transdermal">Transdermal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="med-instructions">Instructions</Label>
                  <Textarea
                    id="med-instructions"
                    value={manualEntry.instructions}
                    onChange={(e) => setManualEntry({ ...manualEntry, instructions: e.target.value })}
                    placeholder="e.g., Take with food, avoid alcohol, monitor blood pressure"
                    rows={3}
                  />
                </div>

                <Button onClick={submitManualEntry} disabled={!manualEntry.name || !manualEntry.dosage}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Medication
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Medication Scan History
                </CardTitle>
                <CardDescription>Recent medication scans and entries with method tracking</CardDescription>
              </CardHeader>
              <CardContent>
                {medicationHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Pill className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No medications scanned yet</p>
                    <p className="text-sm">Start by scanning a medication barcode or label</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medicationHistory.map((med) => (
                      <div key={med.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{med.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">{med.dosage}</Badge>
                            <Badge className={getScanMethodColor(med.scanMethod)}>
                              {getScanMethodIcon(med.scanMethod)}
                              <span className="ml-1 capitalize">{med.scanMethod}</span>
                            </Badge>
                            <Badge
                              className={
                                med.confidence >= 90
                                  ? "bg-green-100 text-green-800"
                                  : med.confidence >= 70
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }
                            >
                              {med.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Strength:</span> {med.strength}
                          </div>
                          <div>
                            <span className="font-medium">NDC:</span> {med.ndc}
                          </div>
                          <div>
                            <span className="font-medium">Manufacturer:</span> {med.manufacturer}
                          </div>
                          <div>
                            <span className="font-medium">Scanned:</span>{" "}
                            {new Date(med.scanTimestamp).toLocaleDateString()}
                          </div>
                        </div>
                        {med.instructions && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Instructions:</span> {med.instructions}
                          </p>
                        )}
                        {med.barcodeData && (
                          <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-1 rounded">
                            Barcode: {med.barcodeData}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Medication Education & Guidelines
                </CardTitle>
                <CardDescription>Clinical guidance and educational resources for field nurses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {educationContent.map((education, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            {education.category.includes("Diabetes") ? (
                              <Activity className="h-4 w-4 text-blue-600" />
                            ) : education.category.includes("Cardiovascular") ? (
                              <Heart className="h-4 w-4 text-red-600" />
                            ) : (
                              <Brain className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          {education.title}
                        </CardTitle>
                        <Badge className="w-fit">{education.category}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">{education.content}</p>

                        <div>
                          <Label className="font-medium text-green-600 flex items-center mb-2">
                            <Lightbulb className="h-4 w-4 mr-1" />
                            Clinical Tips
                          </Label>
                          <ul className="space-y-1">
                            {education.tips.map((tip, tipIndex) => (
                              <li
                                key={tipIndex}
                                className="text-xs p-2 bg-green-50 rounded border-l-2 border-green-300"
                              >
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <Label className="font-medium text-red-600 flex items-center mb-2">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Warnings & Precautions
                          </Label>
                          <ul className="space-y-1">
                            {education.warnings.map((warning, warningIndex) => (
                              <li
                                key={warningIndex}
                                className="text-xs p-2 bg-red-50 rounded border-l-2 border-red-300"
                              >
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <Label className="font-medium text-blue-600 mb-2 block">Resources</Label>
                          <div className="space-y-1">
                            {education.resources.map((resource, resourceIndex) => (
                              <Button
                                key={resourceIndex}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start text-xs bg-transparent"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                {resource}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sheets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Medication Administration Sheets
                </CardTitle>
                <CardDescription>Generate and manage medication administration records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button variant="outline" className="justify-start bg-transparent">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate MAR Sheet
                      </Button>
                      <Button variant="outline" className="justify-start bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        Download Templates
                      </Button>
                      <Button variant="outline" className="justify-start bg-transparent">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync with Axxess
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="font-medium mb-3 block">Recent Medication Sheets</Label>
                      <div className="space-y-2">
                        <div className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Margaret Anderson - MAR</p>
                            <p className="text-xs text-gray-500">Generated today at 2:30 PM</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Robert Thompson - MAR</p>
                            <p className="text-xs text-gray-500">Generated yesterday at 10:15 AM</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="font-medium mb-3 block">Sheet Templates</Label>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          Medication Administration Record (MAR)
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          PRN Medication Log
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          Controlled Substance Log
                        </Button>
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <FileText className="h-4 w-4 mr-2" />
                          Medication Error Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Education Dialog */}
        <Dialog open={showEducation} onOpenChange={setShowEducation}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                {currentEducation?.title}
              </DialogTitle>
              <DialogDescription>{currentEducation?.category}</DialogDescription>
            </DialogHeader>

            {currentEducation && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Overview</h4>
                  <p className="text-sm text-gray-600">{currentEducation.content}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-3 flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Clinical Tips
                    </h4>
                    <div className="space-y-2">
                      {currentEducation.tips.map((tip, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-red-600 mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Warnings & Precautions
                    </h4>
                    <div className="space-y-2">
                      {currentEducation.warnings.map((warning, index) => (
                        <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                          <p className="text-sm">{warning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-600 mb-3">Additional Resources</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {currentEducation.resources.map((resource, index) => (
                      <Button key={index} variant="outline" size="sm" className="justify-start bg-transparent">
                        <Download className="h-4 w-4 mr-2" />
                        {resource}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
